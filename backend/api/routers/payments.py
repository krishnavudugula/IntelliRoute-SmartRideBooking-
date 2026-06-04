"""Payments router"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from decimal import Decimal

from database import get_db
from models.base import Payment, WalletTransaction, User, Ride
from schemas.base import PaymentResponse, WalletResponse, WalletAddMoneyRequest
from core.security import get_current_user

router = APIRouter()

@router.post("/create-payment", response_model=PaymentResponse)
async def create_payment(payment_data: dict, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a payment"""
    
    user_id = int(current_user.get("sub"))
    ride_id = payment_data.get("ride_id")
    method = payment_data.get("method", "cash")
    
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found"
        )
    
    payment = Payment(
        ride_id=ride_id,
        user_id=user_id,
        amount=ride.total_fare,
        method=method,
        status="completed"
    )
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    return payment

@router.get("/wallet", response_model=WalletResponse)
async def get_wallet_balance(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user's wallet balance"""
    
    user_id = int(current_user.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"balance": user.wallet_balance}

@router.post("/wallet/add-money")
async def add_wallet_money(amount_data: WalletAddMoneyRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Add money to wallet"""
    
    user_id = int(current_user.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.wallet_balance += amount_data.amount
    
    # Create wallet transaction
    transaction = WalletTransaction(
        user_id=user_id,
        transaction_type="credit",
        amount=amount_data.amount,
        reason="Manual top-up",
        balance_after=user.wallet_balance
    )
    
    db.add(transaction)
    db.commit()
    
    return {"wallet_balance": user.wallet_balance}

@router.get("/wallet/transactions")
async def get_wallet_transactions(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user's wallet transactions"""
    
    user_id = int(current_user.get("sub"))
    transactions = db.query(WalletTransaction).filter(WalletTransaction.user_id == user_id).all()
    
    return transactions
