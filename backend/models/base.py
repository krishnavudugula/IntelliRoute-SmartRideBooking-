"""SQLAlchemy models for the application"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Table, Numeric, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from database import Base

# Association table for ride requests and drivers
ride_request_drivers = Table(
    'ride_request_drivers',
    Base.metadata,
    Column('ride_request_id', Integer, ForeignKey('ride_requests.id')),
    Column('driver_id', Integer, ForeignKey('drivers.id'))
)

class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    password_hash = Column(String(255))
    phone = Column(String(15), unique=True)
    
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    gender = Column(String(1), nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), default="India")
    
    rating = Column(Float, default=5.0)
    total_rides = Column(Integer, default=0)
    verified = Column(Boolean, default=False)
    wallet_balance = Column(Numeric(10, 2), default=0)
    
    emergency_contact = Column(String(15), nullable=True)
    emergency_contact_name = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    rides = relationship("Ride", back_populates="user")
    preferences = relationship("UserPreference", back_populates="user", uselist=False)
    payments = relationship("Payment", back_populates="user")
    wallet_transactions = relationship("WalletTransaction", back_populates="user")

class UserPreference(Base):
    """User preferences model"""
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    share_ride = Column(Boolean, default=True)
    ac_only = Column(Boolean, default=False)
    female_driver = Column(Boolean, default=False)
    quiet_ride = Column(Boolean, default=False)
    emergency_sharing = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="preferences")

class Driver(Base):
    """Driver model"""
    __tablename__ = "drivers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    vehicle_type = Column(String(10))
    vehicle_number = Column(String(20), unique=True)
    vehicle_model = Column(String(100))
    vehicle_color = Column(String(50))
    
    license_number = Column(String(50), unique=True)
    license_expiry = Column(DateTime)
    insurance_number = Column(String(50), nullable=True)
    insurance_expiry = Column(DateTime, nullable=True)
    
    status = Column(String(20), default="offline")
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=False)
    
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    last_location_update = Column(DateTime, nullable=True)
    
    total_rides = Column(Integer, default=0)
    total_earnings = Column(Numeric(10, 2), default=0)
    rating = Column(Float, default=5.0)
    acceptance_rate = Column(Float, default=100.0)
    cancellation_rate = Column(Float, default=0.0)
    
    subscription_type = Column(String(20), default="free")
    subscription_active_until = Column(DateTime, nullable=True)
    
    documents_verified = Column(Boolean, default=False)
    background_check_passed = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    rides = relationship("Ride", back_populates="driver")
    documents = relationship("DriverDocument", back_populates="driver")
    bank_account = relationship("DriverBankAccount", back_populates="driver", uselist=False)
    earnings = relationship("DriverEarnings", back_populates="driver", uselist=False)
    ride_requests = relationship("RideRequest", secondary=ride_request_drivers, back_populates="drivers")

class DriverDocument(Base):
    """Driver documents model"""
    __tablename__ = "driver_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"))
    
    document_type = Column(String(50))
    document_file = Column(String(255))
    status = Column(String(20), default="pending")
    
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    driver = relationship("Driver", back_populates="documents")

class DriverBankAccount(Base):
    """Driver bank account model"""
    __tablename__ = "driver_bank_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), unique=True)
    
    account_holder_name = Column(String(255))
    account_number = Column(String(50))
    ifsc_code = Column(String(15))
    bank_name = Column(String(255))
    account_type = Column(String(20))
    
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    driver = relationship("Driver", back_populates="bank_account")

class Location(Base):
    """Saved location model"""
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    label = Column(String(50))
    name = Column(String(255))
    latitude = Column(Float)
    longitude = Column(Float)
    address = Column(Text)
    
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Ride(Base):
    """Ride model"""
    __tablename__ = "rides"
    
    id = Column(Integer, primary_key=True, index=True)
    ride_id = Column(String(20), unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    
    vehicle_type = Column(String(10))
    status = Column(String(30), default="searching")
    
    pickup_latitude = Column(Float)
    pickup_longitude = Column(Float)
    pickup_address = Column(String(255))
    
    drop_latitude = Column(Float)
    drop_longitude = Column(Float)
    drop_address = Column(String(255))
    
    distance_km = Column(Float, default=0)
    estimated_time_minutes = Column(Integer, default=0)
    actual_time_minutes = Column(Integer, nullable=True)
    
    base_fare = Column(Numeric(10, 2), default=0)
    distance_charge = Column(Numeric(10, 2), default=0)
    time_charge = Column(Numeric(10, 2), default=0)
    surge_multiplier = Column(Float, default=1.0)
    platform_fee = Column(Numeric(10, 2), default=0)
    tax = Column(Numeric(10, 2), default=0)
    total_fare = Column(Numeric(10, 2), default=0)
    
    otp = Column(String(6), nullable=True)
    otp_verified = Column(Boolean, default=False)
    otp_verified_at = Column(DateTime, nullable=True)
    
    is_shared = Column(Boolean, default=False)
    ratings_given = Column(Boolean, default=False)
    
    requested_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    cancelled_reason = Column(String(255), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="rides")
    driver = relationship("Driver", back_populates="rides")

class RideRequest(Base):
    """Ride request broadcast model"""
    __tablename__ = "ride_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    ride_id = Column(Integer, ForeignKey("rides.id"), unique=True)
    
    search_radius_km = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    expired_at = Column(DateTime)
    
    # Relationships
    drivers = relationship("Driver", secondary=ride_request_drivers, back_populates="ride_requests")

class RideTracking(Base):
    """Real-time ride tracking model"""
    __tablename__ = "ride_tracking"
    
    id = Column(Integer, primary_key=True, index=True)
    ride_id = Column(Integer, ForeignKey("rides.id"), unique=True)
    
    driver_latitude = Column(Float, nullable=True)
    driver_longitude = Column(Float, nullable=True)
    distance_to_destination = Column(Float, nullable=True)
    
    last_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class RideRating(Base):
    """Ride rating model"""
    __tablename__ = "ride_ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    ride_id = Column(Integer, ForeignKey("rides.id"), unique=True)
    
    driver_rating = Column(Integer, default=5)
    driver_comment = Column(Text, nullable=True)
    rider_rating = Column(Integer, default=5)
    rider_comment = Column(Text, nullable=True)
    reported_issue = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class Payment(Base):
    """Payment model"""
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    ride_id = Column(Integer, ForeignKey("rides.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    amount = Column(Numeric(10, 2))
    method = Column(String(20))
    status = Column(String(20), default="pending")
    transaction_id = Column(String(100), unique=True, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="payments")

class WalletTransaction(Base):
    """Wallet transaction model"""
    __tablename__ = "wallet_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    transaction_type = Column(String(20))
    amount = Column(Numeric(10, 2))
    reason = Column(String(255))
    balance_after = Column(Numeric(10, 2))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="wallet_transactions")

class DriverEarnings(Base):
    """Driver earnings model"""
    __tablename__ = "driver_earnings"
    
    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), unique=True)
    
    total_earnings = Column(Numeric(10, 2), default=0)
    total_paid = Column(Numeric(10, 2), default=0)
    balance = Column(Numeric(10, 2), default=0)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    driver = relationship("Driver", back_populates="earnings")

class Payout(Base):
    """Driver payout model"""
    __tablename__ = "payouts"
    
    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"))
    
    amount = Column(Numeric(10, 2))
    status = Column(String(20), default="pending")
    reference_id = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
