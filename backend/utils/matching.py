"""Matching engine for driver assignment"""

from math import radians, cos, sin, asin, sqrt
from sqlalchemy.orm import Session
from core.config import settings

class MatchingEngine:
    """Match riders with drivers using intelligent algorithms"""
    
    @staticmethod
    def distance_between_points(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two coordinates using Haversine formula"""
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        r = 6371  # Radius of earth in kilometers
        
        return c * r
    
    @staticmethod
    def get_nearby_drivers(db: Session, pickup_latitude: float, pickup_longitude: float, vehicle_type: str, radius_km: float = 2.0):
        """Get drivers within specified radius"""
        from models.base import Driver
        
        drivers = db.query(Driver).filter(
            Driver.status == "online",
            Driver.is_verified == True,
            Driver.vehicle_type == vehicle_type,
            Driver.current_latitude.isnot(None),
            Driver.current_longitude.isnot(None)
        ).all()
        
        nearby_drivers = []
        for driver in drivers:
            distance = MatchingEngine.distance_between_points(
                driver.current_latitude,
                driver.current_longitude,
                pickup_latitude,
                pickup_longitude
            )
            if distance <= radius_km:
                nearby_drivers.append((driver, distance))
        
        # Sort by distance and return top 10
        nearby_drivers.sort(key=lambda x: x[1])
        return [driver[0] for driver in nearby_drivers[:10]]
    
    @staticmethod
    def score_driver(driver, pickup_latitude: float, pickup_longitude: float) -> float:
        """Score driver based on multiple factors"""
        score = 100.0
        
        # Distance factor (0-40 points)
        if driver.current_latitude and driver.current_longitude:
            distance = MatchingEngine.distance_between_points(
                driver.current_latitude,
                driver.current_longitude,
                pickup_latitude,
                pickup_longitude
            )
            distance_score = max(0, 40 - (distance * 10))
            score += distance_score
        
        # Rating factor (0-30 points)
        rating_score = (float(driver.rating) / 5.0) * 30
        score += rating_score
        
        # Acceptance rate factor (0-20 points)
        acceptance_score = (float(driver.acceptance_rate) / 100.0) * 20
        score += acceptance_score
        
        # Cancellation rate penalty (-0-10 points)
        cancellation_penalty = (float(driver.cancellation_rate) / 100.0) * 10
        score -= cancellation_penalty
        
        return max(0, score)
    
    @staticmethod
    def find_best_driver(pickup_latitude: float, pickup_longitude: float, vehicle_type: str, area_type: str = "urban", db: Session = None):
        """Find best driver for a ride request"""
        if not db:
            return None
        
        radius = settings.MATCHING_RADIUS.get(area_type, 2.0)
        nearby_drivers = MatchingEngine.get_nearby_drivers(
            db,
            pickup_latitude,
            pickup_longitude,
            vehicle_type,
            radius
        )
        
        if not nearby_drivers:
            return None
        
        # Score all nearby drivers
        scored_drivers = [
            (driver, MatchingEngine.score_driver(driver, pickup_latitude, pickup_longitude))
            for driver in nearby_drivers
        ]
        
        # Sort by score descending
        scored_drivers.sort(key=lambda x: x[1], reverse=True)
        
        # Return driver with highest score
        best_driver = scored_drivers[0][0] if scored_drivers else None
        return best_driver
    
    @staticmethod
    def expand_search_radius(current_radius: float, max_attempts: int = 3) -> float:
        """Expand search radius if no drivers found"""
        expansion_factors = [1.5, 2.0, 3.0]
        if max_attempts > len(expansion_factors):
            max_attempts = len(expansion_factors)
        
        return current_radius * expansion_factors[min(max_attempts - 1, 2)]
