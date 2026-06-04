"""Pydantic schemas for request/response validation"""

from pydantic import BaseModel, EmailStr
from typing import Any, Dict, List, Optional
from datetime import datetime
from decimal import Decimal

# ===== Auth Schemas =====
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: 'UserResponse'

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# ===== User Schemas =====
class UserBase(BaseModel):
    username: str
    email: EmailStr
    phone: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_contact_name: Optional[str] = None

class UserResponse(UserBase):
    id: int
    rating: float
    total_rides: int
    verified: bool
    wallet_balance: Decimal
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserPreferenceResponse(BaseModel):
    share_ride: bool
    ac_only: bool
    female_driver: bool
    quiet_ride: bool
    
    class Config:
        from_attributes = True

# ===== Driver Schemas =====
class DriverRegister(BaseModel):
    vehicle_type: str
    vehicle_number: str
    vehicle_model: str
    vehicle_color: str = "White"
    license_number: str
    license_expiry: datetime
    insurance_number: Optional[str] = None
    insurance_expiry: Optional[datetime] = None

class DriverBase(BaseModel):
    vehicle_type: str
    vehicle_number: str
    license_number: str

class DriverResponse(BaseModel):
    id: int
    user_id: int
    status: str
    rating: float
    total_rides: int
    total_earnings: Decimal
    is_verified: bool
    vehicle_type: str
    vehicle_number: str
    vehicle_model: str
    vehicle_color: str
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    acceptance_rate: float
    profile_complete: bool = True
    user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class DriverLocationUpdate(BaseModel):
    latitude: float
    longitude: float

class DriverEarningsResponse(BaseModel):
    total_earnings: Decimal
    total_paid: Decimal
    balance: Decimal
    
    class Config:
        from_attributes = True

# ===== Ride Schemas =====
class RideCreateRequest(BaseModel):
    vehicle_type: str
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    pickup_address: Optional[str] = None
    drop_latitude: Optional[float] = None
    drop_longitude: Optional[float] = None
    drop_address: Optional[str] = None
    pickup_location: Optional[str] = None
    drop_location: Optional[str] = None

class RideEstimateRequest(BaseModel):
    pickup_location: str
    drop_location: str
    vehicle_type: str

class RideResponse(BaseModel):
    id: int
    ride_id: str
    user_id: int
    driver_id: Optional[int] = None
    vehicle_type: str
    status: str
    distance_km: float
    estimated_time_minutes: int
    total_fare: Decimal
    otp: Optional[str] = None
    requested_at: datetime
    
    class Config:
        from_attributes = True

class RideDetailResponse(RideResponse):
    pickup_latitude: float
    pickup_longitude: float
    pickup_address: str
    drop_latitude: float
    drop_longitude: float
    drop_address: str
    base_fare: Decimal
    distance_charge: Decimal
    time_charge: Decimal
    surge_multiplier: float
    platform_fee: Decimal
    tax: Decimal
    driver: Optional[DriverResponse] = None
    accepted_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    actual_time_minutes: Optional[int] = None
    road_analysis: Optional[Dict[str, Any]] = None
    route_coordinates: Optional[List[Dict[str, float]]] = None
    completion_summary: Optional[Dict[str, Any]] = None

class RideAcceptRequest(BaseModel):
    pass

class RideStartRequest(BaseModel):
    otp: str

class RideCompleteRequest(BaseModel):
    pass

class RideCancelRequest(BaseModel):
    reason: Optional[str] = None

class RideRatingRequest(BaseModel):
    driver_rating: int
    driver_comment: Optional[str] = None
    reported_issue: Optional[str] = None

class RideRatingResponse(BaseModel):
    id: int
    ride_id: int
    driver_rating: int
    driver_comment: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# ===== Location Schemas =====
class LocationCreate(BaseModel):
    label: str
    name: str
    latitude: float
    longitude: float
    address: str

class LocationResponse(LocationCreate):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True

# ===== Payment Schemas =====
class PaymentCreate(BaseModel):
    ride_id: int
    method: str

class PaymentResponse(BaseModel):
    id: int
    ride_id: int
    amount: Decimal
    method: str
    status: str
    
    class Config:
        from_attributes = True

# ===== Wallet Schemas =====
class WalletAddRequest(BaseModel):
    amount: float

class WalletResponse(BaseModel):
    balance: Decimal
    total_spent: Decimal
    total_added: Decimal

class WalletResponse(BaseModel):
    balance: Decimal

class WalletAddMoneyRequest(BaseModel):
    amount: Decimal

# ===== Auth Schemas =====
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str
    user: UserResponse
