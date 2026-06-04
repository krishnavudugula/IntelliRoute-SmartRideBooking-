"""Predefined Warangal demo data for ride booking and road analysis."""

from math import asin, cos, radians, sin, sqrt


VEHICLE_TYPES = [
    {"value": "bike", "label": "Bike", "icon": "BIKE"},
    {"value": "auto", "label": "Auto", "icon": "AUTO"},
    {"value": "car", "label": "Car", "icon": "CAR"},
]


WARANGAL_LOCATIONS = [
    {
        "name": "Hanamkonda Chowrasta",
        "latitude": 18.0094,
        "longitude": 79.5580,
        "address": "Hanamkonda Chowrasta, Warangal",
    },
    {
        "name": "Kazipet",
        "latitude": 18.0106,
        "longitude": 79.5000,
        "address": "Kazipet, Warangal",
    },
    {
        "name": "Balasamudram",
        "latitude": 18.0040,
        "longitude": 79.5585,
        "address": "Balasamudram, Hanamkonda",
    },
    {
        "name": "Subedari",
        "latitude": 18.0057,
        "longitude": 79.5589,
        "address": "Subedari, Hanamkonda",
    },
    {
        "name": "Nakkalagutta",
        "latitude": 18.0004,
        "longitude": 79.5770,
        "address": "Nakkalagutta, Hanamkonda",
    },
    {
        "name": "Hunter Road",
        "latitude": 17.9936,
        "longitude": 79.5872,
        "address": "Hunter Road, Warangal",
    },
    {
        "name": "Mulugu Road",
        "latitude": 18.0146,
        "longitude": 79.5986,
        "address": "Mulugu Road, Warangal",
    },
    {
        "name": "KU Cross Road",
        "latitude": 18.0338,
        "longitude": 79.5462,
        "address": "KU Cross Road, Hanamkonda",
    },
    {
        "name": "Warangal Railway Station",
        "latitude": 17.9754,
        "longitude": 79.5941,
        "address": "Warangal Railway Station, Warangal",
    },
    {
        "name": "Kakatiya University",
        "latitude": 18.0308,
        "longitude": 79.5414,
        "address": "Kakatiya University, Hanamkonda",
    },
    {
        "name": "Enumamula",
        "latitude": 17.9681,
        "longitude": 79.6325,
        "address": "Enumamula Market, Warangal",
    },
    {
        "name": "Waddepally",
        "latitude": 18.0230,
        "longitude": 79.5298,
        "address": "Waddepally, Hanamkonda",
    },
]


ROUTE_PROFILES = {
    ("Hanamkonda Chowrasta", "Kazipet"): {
        "traffic_density": "Medium",
        "traffic_level": "Moderate",
        "road_condition": "Good",
        "road_quality": "Good",
        "accident_risk": "Low",
        "congestion_level": "Low",
        "safety_score": 84,
        "crowd_level": "Medium",
        "recommended_speed": "38 km/h",
    },
    ("Hanamkonda Chowrasta", "Warangal Railway Station"): {
        "traffic_density": "High",
        "traffic_level": "Busy",
        "road_condition": "Fair",
        "road_quality": "Fair",
        "accident_risk": "Medium",
        "congestion_level": "High",
        "safety_score": 71,
        "crowd_level": "High",
        "recommended_speed": "28 km/h",
    },
    ("Kazipet", "Kakatiya University"): {
        "traffic_density": "Low",
        "traffic_level": "Clear",
        "road_condition": "Good",
        "road_quality": "Good",
        "accident_risk": "Low",
        "congestion_level": "Low",
        "safety_score": 88,
        "crowd_level": "Low",
        "recommended_speed": "42 km/h",
    },
    ("Subedari", "Hunter Road"): {
        "traffic_density": "Medium",
        "traffic_level": "Moderate",
        "road_condition": "Fair",
        "road_quality": "Fair",
        "accident_risk": "Medium",
        "congestion_level": "Medium",
        "safety_score": 76,
        "crowd_level": "Medium",
        "recommended_speed": "32 km/h",
    },
    ("Mulugu Road", "Enumamula"): {
        "traffic_density": "High",
        "traffic_level": "Heavy",
        "road_condition": "Fair",
        "road_quality": "Mixed",
        "accident_risk": "Medium",
        "congestion_level": "High",
        "safety_score": 68,
        "crowd_level": "High",
        "recommended_speed": "25 km/h",
    },
    ("Nakkalagutta", "Waddepally"): {
        "traffic_density": "Low",
        "traffic_level": "Clear",
        "road_condition": "Good",
        "road_quality": "Good",
        "accident_risk": "Low",
        "congestion_level": "Low",
        "safety_score": 86,
        "crowd_level": "Low",
        "recommended_speed": "40 km/h",
    },
    ("Balasamudram", "KU Cross Road"): {
        "traffic_density": "Medium",
        "traffic_level": "Moderate",
        "road_condition": "Good",
        "road_quality": "Good",
        "accident_risk": "Low",
        "congestion_level": "Medium",
        "safety_score": 82,
        "crowd_level": "Medium",
        "recommended_speed": "36 km/h",
    },
}


FALLBACK_PROFILES = [
    {
        "traffic_density": "Low",
        "traffic_level": "Clear",
        "road_condition": "Good",
        "road_quality": "Good",
        "accident_risk": "Low",
        "congestion_level": "Low",
        "safety_score": 87,
        "crowd_level": "Low",
        "recommended_speed": "42 km/h",
    },
    {
        "traffic_density": "Medium",
        "traffic_level": "Moderate",
        "road_condition": "Good",
        "road_quality": "Good",
        "accident_risk": "Low",
        "congestion_level": "Medium",
        "safety_score": 80,
        "crowd_level": "Medium",
        "recommended_speed": "35 km/h",
    },
    {
        "traffic_density": "High",
        "traffic_level": "Busy",
        "road_condition": "Fair",
        "road_quality": "Mixed",
        "accident_risk": "Medium",
        "congestion_level": "High",
        "safety_score": 72,
        "crowd_level": "High",
        "recommended_speed": "28 km/h",
    },
]


def normalize_vehicle_type(vehicle_type: str) -> str:
    value = (vehicle_type or "").strip().lower()
    aliases = {
        "cab": "car",
        "mini": "car",
        "sedan": "car",
        "suv": "car",
        "premium": "car",
    }
    return aliases.get(value, value)


def get_location(name: str):
    if not name:
        return None
    wanted = name.strip().lower()
    for location in WARANGAL_LOCATIONS:
        if location["name"].lower() == wanted:
            return location
    return None


def distance_between_locations(pickup: dict, drop: dict) -> float:
    lat1, lon1, lat2, lon2 = map(
        radians,
        [
            pickup["latitude"],
            pickup["longitude"],
            drop["latitude"],
            drop["longitude"],
        ],
    )
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    return round(6371 * c * 1.18, 2)


def _profile_for_pair(pickup_name: str, drop_name: str) -> dict:
    direct = ROUTE_PROFILES.get((pickup_name, drop_name))
    if direct:
        return direct.copy()

    reverse = ROUTE_PROFILES.get((drop_name, pickup_name))
    if reverse:
        return reverse.copy()

    selector = sum(ord(ch) for ch in f"{pickup_name}|{drop_name}") % len(FALLBACK_PROFILES)
    return FALLBACK_PROFILES[selector].copy()


def route_coordinates(pickup: dict, drop: dict) -> list[dict]:
    points = []
    steps = 8
    seed = sum(ord(ch) for ch in pickup["name"] + drop["name"])
    bend = 0.006 if seed % 2 == 0 else -0.006

    for index in range(steps + 1):
        t = index / steps
        curve = sin(t * 3.14159) * bend
        points.append(
            {
                "latitude": round(
                    pickup["latitude"] + (drop["latitude"] - pickup["latitude"]) * t + curve,
                    6,
                ),
                "longitude": round(
                    pickup["longitude"] + (drop["longitude"] - pickup["longitude"]) * t - curve / 2,
                    6,
                ),
            }
        )
    return points


def build_route_profile(pickup_name: str, drop_name: str) -> dict:
    pickup = get_location(pickup_name)
    drop = get_location(drop_name)
    if not pickup or not drop:
        raise ValueError("Pickup and destination must be predefined Warangal locations")
    if pickup["name"] == drop["name"]:
        raise ValueError("Pickup and destination must be different")

    distance = distance_between_locations(pickup, drop)
    profile = _profile_for_pair(pickup["name"], drop["name"])
    speed_value = int(profile["recommended_speed"].split()[0])
    eta = max(4, round((distance / max(speed_value, 15)) * 60))

    profile.update(
        {
            "pickup": pickup,
            "drop": drop,
            "distance_km": distance,
            "estimated_time_minutes": eta,
            "route_coordinates": route_coordinates(pickup, drop),
        }
    )
    return profile
