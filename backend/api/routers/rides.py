"""Rides router for the IntelliRoute demo transportation flow."""

import random
import string
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.base import (
    Driver,
    DriverEarnings,
    Payment,
    Ride,
    RideRating,
    RideRequest,
    RideTracking,
    User,
    WalletTransaction,
)
from schemas.base import (
    RideCancelRequest,
    RideCreateRequest,
    RideDetailResponse,
    RideEstimateRequest,
    RideRatingRequest,
    RideRatingResponse,
    RideStartRequest,
)
from core.security import get_current_user
from utils.matching import MatchingEngine
from utils.pricing import PricingEngine
from utils.warangal_demo import (
    VEHICLE_TYPES,
    WARANGAL_LOCATIONS,
    build_route_profile,
    get_location,
    normalize_vehicle_type,
)

router = APIRouter()


def _decimal(value) -> Decimal:
    return Decimal(str(value or 0))


def _public_user_payload(user: Optional[User]) -> Optional[dict]:
    if not user:
        return None
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "phone": user.phone,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "rating": float(user.rating or 5.0),
        "total_rides": user.total_rides or 0,
        "verified": bool(user.verified),
        "wallet_balance": _decimal(user.wallet_balance),
        "created_at": user.created_at,
    }


def _driver_payload(driver: Optional[Driver]) -> Optional[dict]:
    if not driver:
        return None
    return {
        "id": driver.id,
        "user_id": driver.user_id,
        "status": driver.status,
        "rating": float(driver.rating or 5.0),
        "total_rides": driver.total_rides or 0,
        "total_earnings": _decimal(driver.total_earnings),
        "is_verified": bool(driver.is_verified),
        "vehicle_number": driver.vehicle_number or "Profile pending",
        "vehicle_model": driver.vehicle_model or driver.vehicle_type.title(),
        "vehicle_color": driver.vehicle_color or "White",
        "current_latitude": driver.current_latitude,
        "current_longitude": driver.current_longitude,
        "acceptance_rate": float(driver.acceptance_rate or 100.0),
        "profile_complete": True,
        "user": _public_user_payload(driver.user),
    }


def _profile_for_ride(ride: Ride) -> Optional[dict]:
    try:
        return build_route_profile(ride.pickup_address, ride.drop_address)
    except ValueError:
        return None


def _completion_summary(ride: Ride, profile: Optional[dict]) -> Optional[dict]:
    if ride.status != "completed":
        return None
    safety_score = profile["safety_score"] if profile else None
    return {
        "message": "Ride Completed Successfully",
        "distance_covered": round(float(ride.distance_km or 0), 2),
        "time_taken": ride.actual_time_minutes or ride.estimated_time_minutes,
        "fare_paid": float(ride.total_fare or 0),
        "safety_score": safety_score,
    }


def serialize_ride_detail(ride: Ride) -> dict:
    profile = _profile_for_ride(ride)
    return {
        "id": ride.id,
        "ride_id": ride.ride_id,
        "user_id": ride.user_id,
        "driver_id": ride.driver_id,
        "vehicle_type": normalize_vehicle_type(ride.vehicle_type),
        "status": ride.status,
        "pickup_latitude": ride.pickup_latitude,
        "pickup_longitude": ride.pickup_longitude,
        "pickup_address": ride.pickup_address,
        "drop_latitude": ride.drop_latitude,
        "drop_longitude": ride.drop_longitude,
        "drop_address": ride.drop_address,
        "distance_km": float(ride.distance_km or 0),
        "estimated_time_minutes": ride.estimated_time_minutes or 0,
        "actual_time_minutes": ride.actual_time_minutes,
        "base_fare": _decimal(ride.base_fare),
        "distance_charge": _decimal(ride.distance_charge),
        "time_charge": _decimal(ride.time_charge),
        "surge_multiplier": float(ride.surge_multiplier or 1.0),
        "platform_fee": _decimal(ride.platform_fee),
        "tax": _decimal(ride.tax),
        "total_fare": _decimal(ride.total_fare),
        "otp": ride.otp,
        "requested_at": ride.requested_at,
        "accepted_at": ride.accepted_at,
        "started_at": ride.started_at,
        "completed_at": ride.completed_at,
        "driver": _driver_payload(ride.driver),
        "road_analysis": profile,
        "route_coordinates": profile["route_coordinates"] if profile else [],
        "completion_summary": _completion_summary(ride, profile),
    }


def _get_route_profile_or_400(pickup_name: str, drop_name: str) -> dict:
    try:
        return build_route_profile(pickup_name, drop_name)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


def _create_pricing(vehicle_type: str, distance_km: float, eta_minutes: int) -> dict:
    pricing_engine = PricingEngine(vehicle_type, distance_km, eta_minutes)
    return pricing_engine.calculate_total_fare()


@router.get("/demo-data")
async def get_demo_data():
    """Return the predefined locations and vehicle types used by the demo."""
    return {"locations": WARANGAL_LOCATIONS, "vehicle_types": VEHICLE_TYPES}


@router.post("/estimate")
async def estimate_ride(estimate: RideEstimateRequest):
    """Estimate fare, distance, ETA, route path, and road analysis."""
    vehicle_type = normalize_vehicle_type(estimate.vehicle_type)
    if vehicle_type not in {"bike", "auto", "car"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle type must be Bike, Auto, or Car",
        )

    profile = _get_route_profile_or_400(estimate.pickup_location, estimate.drop_location)
    pricing = _create_pricing(
        vehicle_type,
        profile["distance_km"],
        profile["estimated_time_minutes"],
    )

    return {
        "vehicle_type": vehicle_type,
        "pickup": profile["pickup"],
        "drop": profile["drop"],
        "distance_km": profile["distance_km"],
        "estimated_time_minutes": profile["estimated_time_minutes"],
        "pricing": pricing,
        "road_analysis": profile,
        "route_coordinates": profile["route_coordinates"],
    }


@router.post("/create-ride", response_model=RideDetailResponse)
async def create_ride(
    ride_data: RideCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a ride request and broadcast it to matching drivers."""
    user_id = int(current_user.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    vehicle_type = normalize_vehicle_type(ride_data.vehicle_type)
    if vehicle_type not in {"bike", "auto", "car"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle type must be Bike, Auto, or Car",
        )

    pickup_name = ride_data.pickup_location or ride_data.pickup_address
    drop_name = ride_data.drop_location or ride_data.drop_address
    pickup_location = get_location(pickup_name)
    drop_location = get_location(drop_name)

    if pickup_location and drop_location:
        profile = _get_route_profile_or_400(pickup_location["name"], drop_location["name"])
        pickup_latitude = profile["pickup"]["latitude"]
        pickup_longitude = profile["pickup"]["longitude"]
        drop_latitude = profile["drop"]["latitude"]
        drop_longitude = profile["drop"]["longitude"]
        pickup_address = profile["pickup"]["name"]
        drop_address = profile["drop"]["name"]
        distance = profile["distance_km"]
        estimated_time = profile["estimated_time_minutes"]
    else:
        missing_coordinates = [
            ride_data.pickup_latitude,
            ride_data.pickup_longitude,
            ride_data.drop_latitude,
            ride_data.drop_longitude,
        ]
        if any(value is None for value in missing_coordinates):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Use predefined Warangal locations or provide complete coordinates",
            )
        pickup_latitude = ride_data.pickup_latitude
        pickup_longitude = ride_data.pickup_longitude
        drop_latitude = ride_data.drop_latitude
        drop_longitude = ride_data.drop_longitude
        pickup_address = ride_data.pickup_address or "Pickup"
        drop_address = ride_data.drop_address or "Destination"
        distance = round(
            MatchingEngine.distance_between_points(
                pickup_latitude,
                pickup_longitude,
                drop_latitude,
                drop_longitude,
            ),
            2,
        )
        estimated_time = max(4, int((distance / 35) * 60))

    pricing = _create_pricing(vehicle_type, distance, estimated_time)
    ride_code = f"IR{random.randint(10000, 99999)}"

    ride = Ride(
        ride_id=ride_code,
        user_id=user_id,
        vehicle_type=vehicle_type,
        pickup_latitude=pickup_latitude,
        pickup_longitude=pickup_longitude,
        pickup_address=pickup_address,
        drop_latitude=drop_latitude,
        drop_longitude=drop_longitude,
        drop_address=drop_address,
        distance_km=distance,
        estimated_time_minutes=estimated_time,
        base_fare=pricing["base_fare"],
        distance_charge=pricing["distance_charge"],
        time_charge=pricing["time_charge"],
        surge_multiplier=pricing["surge_multiplier"],
        platform_fee=pricing["platform_fee"],
        tax=pricing["tax"],
        total_fare=pricing["total_fare"],
        otp="".join(random.choices(string.digits, k=4)),
        status="searching",
    )

    db.add(ride)
    db.flush()

    db.add(RideTracking(ride_id=ride.id))
    ride_request = RideRequest(
        ride_id=ride.id,
        search_radius_km=25.0,
        expired_at=datetime.utcnow() + timedelta(minutes=5),
    )

    matched_drivers = MatchingEngine.get_nearby_drivers(
        db,
        pickup_latitude,
        pickup_longitude,
        vehicle_type,
        radius_km=25.0,
    )
    if not matched_drivers:
        matched_drivers = db.query(Driver).filter(
            Driver.status == "online",
            Driver.is_active == True,
            Driver.is_verified == True,
            Driver.vehicle_type == vehicle_type,
        ).limit(10).all()

    ride_request.drivers = matched_drivers
    db.add(ride_request)
    db.commit()
    db.refresh(ride)

    return serialize_ride_detail(ride)


@router.get("/active-ride", response_model=Optional[RideDetailResponse])
async def get_active_ride(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current commuter ride."""
    user_id = int(current_user.get("sub"))
    ride = db.query(Ride).filter(
        (Ride.user_id == user_id)
        & (Ride.status.in_(["searching", "accepted", "arriving", "arrived", "in_progress"]))
    ).order_by(Ride.requested_at.desc()).first()

    if not ride:
        return None
    return serialize_ride_detail(ride)


@router.get("/ride/{ride_id}", response_model=RideDetailResponse)
async def get_ride_detail(
    ride_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get ride details by database ID."""
    user_id = int(current_user.get("sub"))
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found")

    if ride.user_id != user_id and (not ride.driver or ride.driver.user_id != user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this ride",
        )

    return serialize_ride_detail(ride)


@router.get("/ride-history")
async def get_ride_history(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the commuter's completed and cancelled rides."""
    user_id = int(current_user.get("sub"))
    rides = db.query(Ride).filter(
        (Ride.user_id == user_id) & (Ride.status.in_(["completed", "cancelled"]))
    ).order_by(Ride.requested_at.desc()).limit(20).all()
    return [serialize_ride_detail(ride) for ride in rides]


@router.post("/accept-ride/{ride_id}", response_model=RideDetailResponse)
async def accept_ride(
    ride_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Accept a matching ride request as a driver."""
    user_id = int(current_user.get("sub"))
    driver = db.query(Driver).filter(Driver.user_id == user_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found")

    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found")

    if ride.vehicle_type != driver.vehicle_type:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This request is for a different vehicle type",
        )
    if ride.driver_id and ride.driver_id != driver.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ride already accepted by another driver",
        )
    if ride.status != "searching":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ride is not available for acceptance",
        )

    ride.driver_id = driver.id
    ride.status = "accepted"
    ride.accepted_at = datetime.utcnow()
    driver.status = "online"
    driver.is_active = True
    db.commit()
    db.refresh(ride)

    return serialize_ride_detail(ride)


@router.post("/reject-ride/{ride_id}")
async def reject_ride(
    ride_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reject a visible ride request as a driver."""
    user_id = int(current_user.get("sub"))
    driver = db.query(Driver).filter(Driver.user_id == user_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found")

    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found")

    ride_request = db.query(RideRequest).filter(RideRequest.ride_id == ride.id).first()
    if ride_request and driver in ride_request.drivers:
        ride_request.drivers.remove(driver)
        db.commit()

    return {"status": "rejected", "message": "Ride request rejected"}


@router.post("/start-ride/{ride_id}", response_model=RideDetailResponse)
async def start_ride(
    ride_id: int,
    ride_data: RideStartRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Verify OTP and start the ride."""
    user_id = int(current_user.get("sub"))
    driver = db.query(Driver).filter(Driver.user_id == user_id).first()
    ride = db.query(Ride).filter(Ride.id == ride_id).first()

    if not ride:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found")
    if not driver or ride.driver_id != driver.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned driver can start this ride",
        )
    if ride.otp != ride_data.otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")

    ride.status = "in_progress"
    ride.started_at = datetime.utcnow()
    ride.otp_verified = True
    ride.otp_verified_at = datetime.utcnow()
    db.commit()
    db.refresh(ride)

    return serialize_ride_detail(ride)


@router.post("/complete-ride/{ride_id}", response_model=RideDetailResponse)
async def complete_ride(
    ride_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Complete the ride and return a demo completion summary."""
    user_id = int(current_user.get("sub"))
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found")

    is_rider = ride.user_id == user_id
    is_driver = ride.driver and ride.driver.user_id == user_id
    if not is_rider and not is_driver:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to complete this ride",
        )

    if ride.status != "completed":
        ride.status = "completed"
        ride.completed_at = datetime.utcnow()
        if ride.started_at:
            elapsed = (ride.completed_at - ride.started_at).total_seconds() / 60
            ride.actual_time_minutes = max(1, int(elapsed))
        else:
            ride.actual_time_minutes = ride.estimated_time_minutes

        user = ride.user
        user.total_rides = (user.total_rides or 0) + 1

        if ride.driver:
            driver = ride.driver
            driver.total_rides = (driver.total_rides or 0) + 1
            driver_earning = _decimal(ride.total_fare) * Decimal("0.70")
            driver.total_earnings = _decimal(driver.total_earnings) + driver_earning

            earnings = db.query(DriverEarnings).filter(
                DriverEarnings.driver_id == driver.id
            ).first()
            if earnings:
                earnings.total_earnings = _decimal(earnings.total_earnings) + driver_earning
                earnings.balance = _decimal(earnings.total_earnings) - _decimal(earnings.total_paid)

        existing_payment = db.query(Payment).filter(Payment.ride_id == ride.id).first()
        if not existing_payment:
            payment = Payment(
                ride_id=ride.id,
                user_id=ride.user_id,
                amount=ride.total_fare,
                method="demo-wallet",
                status="completed",
            )
            db.add(payment)

        user.wallet_balance = _decimal(user.wallet_balance) - _decimal(ride.total_fare)
        transaction = WalletTransaction(
            user_id=user.id,
            transaction_type="debit",
            amount=ride.total_fare,
            reason=f"Payment for ride {ride.ride_id}",
            balance_after=user.wallet_balance,
        )
        db.add(transaction)
        db.commit()

    db.refresh(ride)
    return serialize_ride_detail(ride)


@router.post("/cancel-ride/{ride_id}")
async def cancel_ride(
    ride_id: int,
    cancel_data: RideCancelRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel a searching or accepted ride."""
    user_id = int(current_user.get("sub"))
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found")

    is_rider = ride.user_id == user_id
    is_driver = ride.driver and ride.driver.user_id == user_id
    if not is_rider and not is_driver:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot cancel this ride")

    if ride.status not in ["searching", "accepted"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only cancel searching or accepted rides",
        )

    ride.status = "cancelled"
    ride.cancelled_at = datetime.utcnow()
    ride.cancelled_reason = cancel_data.reason or "Cancelled"
    db.commit()

    return {"status": "cancelled", "message": "Ride cancelled successfully"}


@router.post("/rate-ride/{ride_id}", response_model=RideRatingResponse)
async def rate_ride(
    ride_id: int,
    rating_data: RideRatingRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Rate a completed ride."""
    user_id = int(current_user.get("sub"))
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found")
    if ride.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only rate your own rides",
        )
    if ride.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only rate completed rides",
        )
    if rating_data.driver_rating < 1 or rating_data.driver_rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be between 1 and 5",
        )

    existing_rating = db.query(RideRating).filter(RideRating.ride_id == ride.id).first()
    if existing_rating:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ride already rated",
        )

    rating = RideRating(
        ride_id=ride.id,
        driver_rating=rating_data.driver_rating,
        driver_comment=rating_data.driver_comment,
        reported_issue=rating_data.reported_issue,
    )
    db.add(rating)
    ride.ratings_given = True

    if ride.driver:
        driver_ride_ids = [item[0] for item in db.query(Ride.id).filter(Ride.driver_id == ride.driver.id).all()]
        ratings = db.query(RideRating).filter(RideRating.ride_id.in_(driver_ride_ids)).all()
        if ratings:
            ride.driver.rating = sum(item.driver_rating for item in ratings) / len(ratings)

    db.commit()
    db.refresh(rating)
    return rating
