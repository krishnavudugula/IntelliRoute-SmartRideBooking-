"""Locations router"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.base import Location
from schemas.base import LocationCreate, LocationResponse
from core.security import get_current_user
from utils.warangal_demo import WARANGAL_LOCATIONS

router = APIRouter()

@router.get("/warangal")
async def get_warangal_locations():
    """Return predefined Warangal locations for demo booking."""
    return WARANGAL_LOCATIONS

@router.post("/save-location", response_model=LocationResponse)
async def save_location(location_data: LocationCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Save a location"""
    
    user_id = int(current_user.get("sub"))
    
    location = Location(
        user_id=user_id,
        label=location_data.label,
        name=location_data.name,
        latitude=location_data.latitude,
        longitude=location_data.longitude,
        address=location_data.address
    )
    
    db.add(location)
    db.commit()
    db.refresh(location)
    
    return location

@router.get("/saved-locations")
async def get_saved_locations(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user's saved locations"""
    
    user_id = int(current_user.get("sub"))
    locations = db.query(Location).filter(Location.user_id == user_id).all()
    
    return locations

@router.post("/search-address")
async def search_address(search_data: dict):
    """Search for address (using Nominatim)"""
    
    query = search_data.get("query", "")
    
    # This would use Nominatim API
    # For now, returning mock data
    return {
        "results": [
            {
                "name": query,
                "latitude": 28.7041,
                "longitude": 77.1025,
                "address": query
            }
        ]
    }
