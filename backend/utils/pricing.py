"""Pricing engine for fare calculation"""

from decimal import Decimal
from core.config import settings

class PricingEngine:
    """Calculate ride fares with all components"""
    
    def __init__(self, vehicle_type: str, distance_km: float, time_minutes: int):
        self.vehicle_type = vehicle_type
        self.distance_km = distance_km
        self.time_minutes = time_minutes
    
    def calculate_base_fare(self) -> Decimal:
        base_fare = settings.BASE_FARE.get(self.vehicle_type, 50)
        return Decimal(str(base_fare))
    
    def calculate_distance_charge(self) -> Decimal:
        if self.distance_km <= 2:
            return Decimal("0")
        distance_rate = settings.DISTANCE_RATE.get(self.vehicle_type, 15)
        distance_charge = (self.distance_km - 2) * distance_rate
        return Decimal(str(distance_charge))
    
    def calculate_time_charge(self) -> Decimal:
        time_rate = settings.TIME_RATE.get(self.vehicle_type, 2)
        time_charge = self.time_minutes * time_rate
        return Decimal(str(time_charge))
    
    def calculate_surge_multiplier(self, demand_supply_ratio: float = 1.0) -> float:
        if demand_supply_ratio < 0.5:
            return 1.0
        elif demand_supply_ratio < 1.0:
            return 1.2
        elif demand_supply_ratio < 1.5:
            return 1.5
        elif demand_supply_ratio < 2.0:
            return 2.0
        else:
            return 2.5
    
    def calculate_total_fare(self, surge_multiplier: float = 1.0) -> dict:
        base_fare = self.calculate_base_fare()
        distance_charge = self.calculate_distance_charge()
        time_charge = self.calculate_time_charge()

        subtotal = (base_fare + distance_charge + time_charge) * Decimal(str(surge_multiplier))
        platform_fee = subtotal * Decimal("0.05")
        tax = (subtotal + platform_fee) * Decimal("0.18")
        total_fare = subtotal + platform_fee + tax

        min_fare = Decimal(str(settings.BASE_FARE.get(self.vehicle_type, 50)))
        if total_fare < min_fare:
            total_fare = min_fare

        return {
            "base_fare": float(base_fare),
            "distance_charge": float(distance_charge),
            "time_charge": float(time_charge),
            "surge_multiplier": surge_multiplier,
            "platform_fee": float(platform_fee),
            "tax": float(tax),
            "total_fare": float(total_fare)
        }

    def get_distance_limit(self) -> float:
        return settings.DISTANCE_LIMITS.get(self.vehicle_type, 80)
