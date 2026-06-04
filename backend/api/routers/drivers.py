"""Drivers router"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models.base import Driver, User, Ride, RideRequest, DriverEarnings
from schemas.base import DriverResponse, DriverLocationUpdate, DriverRegister, DriverEarningsResponse
from core.security import get_current_user
from utils.warangal_demo import get_location, normalize_vehicle_type
from api.routers.rides import serialize_ride_detail

router = APIRouter()

@router.post("/register", response_model=DriverResponse)
async def register_driver(
    driver_data: DriverRegister,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register as a driver"""
    
    user_id = int(current_user.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already a driver
    existing_driver = db.query(Driver).filter(Driver.user_id == user_id).first()
    if existing_driver:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already registered as a driver"
        )
    
    # Create driver profile
    vehicle_type = normalize_vehicle_type(driver_data.vehicle_type)
    driver = Driver(
        user_id=user_id,
        vehicle_type=vehicle_type,
        vehicle_number=driver_data.vehicle_number,
        vehicle_model=driver_data.vehicle_model,
        vehicle_color=driver_data.vehicle_color,
        license_number=driver_data.license_number,
        license_expiry=driver_data.license_expiry,
        insurance_number=driver_data.insurance_number,
        insurance_expiry=driver_data.insurance_expiry,
        status="offline",
        is_verified=True,
        documents_verified=True,
        background_check_passed=True
    )
    
    db.add(driver)
    db.commit()
    
    # Create earnings record
    earnings = DriverEarnings(driver_id=driver.id)
    db.add(earnings)
    db.commit()
    
    db.refresh(driver)
    return driver

@router.get("/me", response_model=DriverResponse)
async def get_driver_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current driver profile"""
    
    user_id = int(current_user.get("sub"))
    driver = db.query(Driver).filter(Driver.user_id == user_id).first()
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found"
        )
    
    return driver

@router.post("/go-online")
async def go_online(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark driver as online"""
    
    user_id = int(current_user.get("sub"))
    driver = db.query(Driver).filter(Driver.user_id == user_id).first()
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found"
        )
    
    driver.status = "online"
    driver.is_active = True
    driver.is_verified = True
    driver.documents_verified = True
    driver.background_check_passed = True
    if driver.current_latitude is None or driver.current_longitude is None:
        default_location = get_location("Hanamkonda Chowrasta")
        driver.current_latitude = default_location["latitude"]
        driver.current_longitude = default_location["longitude"]
        driver.last_location_update = datetime.utcnow()
    db.commit()
    
    return {"status": "online", "message": "You are now online"}

@router.post("/go-offline")
async def go_offline(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark driver as offline"""
    
    user_id = int(current_user.get("sub"))
    driver = db.query(Driver).filter(Driver.user_id == user_id).first()
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found"
        )
    
    driver.status = "offline"
    driver.is_active = False
    db.commit()
    
    return {"status": "offline", "message": "You are now offline"}

@router.post("/update-location")
async def update_location(
    location: DriverLocationUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update driver current location"""
    
    user_id = int(current_user.get("sub"))
    driver = db.query(Driver).filter(Driver.user_id == user_id).first()
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found"
        )
    
    driver.current_latitude = location.latitude
    driver.current_longitude = location.longitude
    driver.last_location_update = datetime.utcnow()
    db.commit()
    
    return {
        "latitude": driver.current_latitude,
        "longitude": driver.current_longitude
    }

@router.get("/active-rides")
async def get_active_rides(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get active rides for driver"""
    
    user_id = int(current_user.get("sub"))
    driver = db.query(Driver).filter(Driver.user_id == user_id).first()
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found"
        )
    
    assigned_rides = db.query(Ride).filter(
        (Ride.driver_id == driver.id) &
        (Ride.status.in_(["accepted", "in_progress"]))
    ).order_by(Ride.requested_at.desc()).all()
    
    request_rides = db.query(Ride).filter(
        (Ride.driver_id.is_(None)) &
        (Ride.status == "searching") &
        (Ride.vehicle_type == driver.vehicle_type)
    ).order_by(Ride.requested_at.desc()).limit(10).all()

    visible_requests = []
    for ride in request_rides:
        ride_request = db.query(RideRequest).filter(RideRequest.ride_id == ride.id).first()
        if ride_request and ride_request.drivers and driver not in ride_request.drivers:
            continue
        visible_requests.append(ride)

    return [serialize_ride_detail(ride) for ride in (visible_requests + assigned_rides)]

@router.get("/earnings", response_model=DriverEarningsResponse)
async def get_earnings(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get driver earnings"""
    
    user_id = int(current_user.get("sub"))
    driver = db.query(Driver).filter(Driver.user_id == user_id).first()
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found"
        )
    
    earnings = db.query(DriverEarnings).filter(DriverEarnings.driver_id == driver.id).first()
    
    if not earnings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Earnings record not found"
        )
    
    return earnings

@router.get("/rides-history")
async def get_rides_history(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get driver's ride history"""
    
    user_id = int(current_user.get("sub"))
    driver = db.query(Driver).filter(Driver.user_id == user_id).first()
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found"
        )
    
    rides = db.query(Ride).filter(
        (Ride.driver_id == driver.id) &
        (Ride.status == "completed")
    ).order_by(Ride.completed_at.desc()).limit(20).all()
    
    return rides
