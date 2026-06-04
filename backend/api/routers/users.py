"""Users router"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from decimal import Decimal

from database import get_db
from models.base import User, Location, WalletTransaction
from schemas.base import (
    UserCreate, UserLogin, UserResponse, TokenResponse, UserUpdate,
    RefreshTokenRequest, LocationCreate, LocationResponse, WalletAddRequest,
    PasswordResetRequest, PasswordResetConfirm
)
from core.security import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    get_current_user, verify_refresh_token, generate_reset_token
)
from core.config import settings

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register new user"""
    
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.phone == user_data.phone)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or phone already registered"
        )
    
    # Create new user
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        phone=user_data.phone,
        password_hash=hash_password(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(new_user.id)},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": str(new_user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(
    req: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    
    try:
        payload = verify_refresh_token(req.refresh_token)
        user_id = int(payload.get("sub"))
    except HTTPException as e:
        raise e
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Create new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "refresh_token": req.refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user (token invalidation on frontend)"""
    user_id = int(current_user.get("sub"))
    
    return {
        "message": "Logged out successfully",
        "user_id": user_id
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user profile"""
    
    user_id = int(current_user.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    
    user_id = int(current_user.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields
    if user_update.first_name:
        user.first_name = user_update.first_name
    if user_update.last_name:
        user.last_name = user_update.last_name
    if user_update.emergency_contact:
        user.emergency_contact = user_update.emergency_contact
    if user_update.emergency_contact_name:
        user.emergency_contact_name = user_update.emergency_contact_name
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    return user

@router.post("/wallet/add", response_model=dict)
async def add_wallet_balance(
    req: WalletAddRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add money to wallet"""
    
    user_id = int(current_user.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if req.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than 0"
        )
    
    # Add to wallet
    old_balance = user.wallet_balance
    user.wallet_balance = Decimal(str(old_balance)) + Decimal(str(req.amount))
    
    # Record transaction
    transaction = WalletTransaction(
        user_id=user_id,
        transaction_type="credit",
        amount=Decimal(str(req.amount)),
        reason="Money added to wallet",
        balance_after=user.wallet_balance
    )
    
    db.add(transaction)
    db.commit()
    
    return {
        "message": "Wallet updated successfully",
        "wallet_balance": float(user.wallet_balance),
        "amount_added": req.amount
    }

@router.get("/wallet", response_model=dict)
async def get_wallet(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get wallet balance"""
    
    user_id = int(current_user.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "wallet_balance": float(user.wallet_balance)
    }

@router.post("/locations", response_model=LocationResponse)
async def save_location(
    location_data: LocationCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save a favorite location"""
    
    user_id = int(current_user.get("sub"))
    
    location = Location(
        user_id=user_id,
        label=location_data.label,
        name=location_data.name,
        latitude=location_data.latitude,
        longitude=location_data.longitude,
        address=location_data.address,
        is_favorite=True
    )
    
    db.add(location)
    db.commit()
    db.refresh(location)
    
    return location

@router.get("/locations", response_model=list)
async def get_locations(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's saved locations"""
    
    user_id = int(current_user.get("sub"))
    locations = db.query(Location).filter(Location.user_id == user_id).all()
    
    return locations

@router.delete("/locations/{location_id}")
async def delete_location(
    location_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a saved location"""
    
    user_id = int(current_user.get("sub"))
    location = db.query(Location).filter(
        (Location.id == location_id) & (Location.user_id == user_id)
    ).first()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    db.delete(location)
    db.commit()
    
    return {"message": "Location deleted"}
