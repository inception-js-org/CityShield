"""
Synthetic Spatio-Temporal Crime Data Generator for Indian Urban Contexts

Generates realistic crime records with proper:
- Indian seasonal patterns
- Monsoon-aware weather simulation
- Polygon-accurate point sampling
- Robust probabilistic modeling
- Holiday-aware crime modulation
"""

import json
import random
import logging
from typing import List, Dict, Tuple, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta, date

import numpy as np
import pandas as pd
from shapely.geometry import Point, Polygon
from shapely.prepared import prep

# ===============================
# Logging Setup
# ===============================

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ===============================
# Crime Taxonomy (Streamlined)
# ===============================

CRIME_SCHEMA: Dict[str, List[str]] = {
    "violent": [
        "homicide", "assault", "aggravated_assault",
        "domestic_violence", "sexual_assault", "kidnapping"
    ],
    "property": [
        "theft", "burglary", "robbery", "vehicle_theft",
        "shoplifting", "vandalism"
    ],
    "white_collar": [
        "fraud", "embezzlement", "identity_theft",
        "forgery", "money_laundering"
    ],
    "victimless": [
        "illegal_gambling", "drug_use", "public_intoxication"
    ],
    "organized": [
        "drug_trafficking", "human_trafficking",
        "extortion", "arms_smuggling"
    ],
    "hate": [
        "communal_violence", "caste_based_attack",
        "gender_based_attack", "religious_attack"
    ]
}

CATEGORIES: List[str] = list(CRIME_SCHEMA.keys())

SEVERITY_MAP: Dict[str, int] = {
    "violent": 4,
    "property": 2,
    "white_collar": 2,
    "victimless": 1,
    "organized": 3,
    "hate": 3
}

# ===============================
# Zone Type Definitions (Matching zones.json)
# ===============================

ZONE_TYPES: List[str] = [
    "residential",
    "commercial",
    "mixed",
    "slum",
    "transport"
]

# Mapping from zones.json field names to generator expected names
ZONE_FIELD_MAPPING: Dict[str, str] = {
    "coords": "polygon",
    "base_crime_rates": "base_category_rates"
}

# Mapping from zones.json crime rate keys to generator category names
CRIME_RATE_MAPPING: Dict[str, str] = {
    "Violent Crimes": "violent",
    "Property Crimes": "property",
    "White-Collar Crimes": "white_collar",
    "Organized Crimes": "organized",
    "Hate Crimes": "hate",
    "__Consensual/Victimless Crimes__": "victimless"
}

# ===============================
# Indian Holiday System
# ===============================

@dataclass
class Holiday:
    """Configuration for Indian holidays."""
    name: str
    holiday_type: str  # national, religious_hindu, religious_muslim, religious_christian, regional
    date: date
    duration_days: int = 1
    crime_multiplier: float = 1.2
    # Zone types where crime increases more (using actual zone types from zones.json)
    high_risk_zones: Tuple[str, ...] = field(default_factory=lambda: ("commercial", "mixed"))
    # Zone types where crime decreases
    low_risk_zones: Tuple[str, ...] = field(default_factory=lambda: ("residential",))
    # Categories that increase during this holiday
    elevated_categories: Tuple[str, ...] = field(default_factory=lambda: ("property", "victimless"))
    # Categories that may spike (religious tensions, etc.)
    risk_categories: Tuple[str, ...] = field(default_factory=tuple)


def generate_indian_holidays(year: int) -> List[Holiday]:
    """
    Generate Indian holidays for a given year.
    Includes national, religious, and regional holidays.
    Zone types aligned with: residential, commercial, mixed, slum, transport
    """
    holidays = [
        # National Holidays
        Holiday(
            name="Republic Day",
            holiday_type="national",
            date=date(year, 1, 26),
            duration_days=1,
            crime_multiplier=1.15,
            high_risk_zones=("commercial", "transport", "mixed"),
            low_risk_zones=("residential",),
            elevated_categories=("property", "victimless"),
            risk_categories=()
        ),
        Holiday(
            name="Independence Day",
            holiday_type="national",
            date=date(year, 8, 15),
            duration_days=1,
            crime_multiplier=1.15,
            high_risk_zones=("commercial", "transport", "mixed"),
            low_risk_zones=("residential",),
            elevated_categories=("property", "victimless"),
            risk_categories=()
        ),
        Holiday(
            name="Gandhi Jayanti",
            holiday_type="national",
            date=date(year, 10, 2),
            duration_days=1,
            crime_multiplier=1.05,
            high_risk_zones=("commercial",),
            low_risk_zones=("residential", "mixed"),
            elevated_categories=("property",),
            risk_categories=()
        ),

        # Hindu Religious Holidays
        Holiday(
            name="Diwali",
            holiday_type="religious_hindu",
            date=date(year, 11, 12),  # Approximate - varies yearly
            duration_days=5,
            crime_multiplier=1.4,
            high_risk_zones=("commercial", "mixed", "residential", "slum"),
            low_risk_zones=(),  # Everyone celebrates, no low-risk zones
            elevated_categories=("property", "victimless", "violent"),
            risk_categories=("hate",)  # Communal tensions possible
        ),
        Holiday(
            name="Holi",
            holiday_type="religious_hindu",
            date=date(year, 3, 25),  # Approximate
            duration_days=2,
            crime_multiplier=1.35,
            high_risk_zones=("residential", "slum", "mixed"),
            low_risk_zones=("commercial",),
            elevated_categories=("violent", "victimless"),  # Alcohol, harassment
            risk_categories=("violent",)
        ),
        Holiday(
            name="Durga Puja",
            holiday_type="religious_hindu",
            date=date(year, 10, 20),  # Approximate
            duration_days=5,
            crime_multiplier=1.3,
            high_risk_zones=("commercial", "mixed", "transport"),
            low_risk_zones=(),
            elevated_categories=("property", "victimless"),
            risk_categories=("hate",)
        ),
        Holiday(
            name="Ganesh Chaturthi",
            holiday_type="religious_hindu",
            date=date(year, 9, 7),  # Approximate
            duration_days=10,
            crime_multiplier=1.25,
            high_risk_zones=("commercial", "mixed", "residential"),
            low_risk_zones=(),
            elevated_categories=("property", "victimless"),
            risk_categories=()
        ),
        Holiday(
            name="Navratri",
            holiday_type="religious_hindu",
            date=date(year, 10, 10),  # Approximate
            duration_days=9,
            crime_multiplier=1.2,
            high_risk_zones=("commercial", "mixed"),
            low_risk_zones=("slum",),
            elevated_categories=("property", "victimless"),
            risk_categories=()
        ),

        # Muslim Religious Holidays
        Holiday(
            name="Eid ul-Fitr",
            holiday_type="religious_muslim",
            date=date(year, 4, 10),  # Approximate - lunar calendar
            duration_days=3,
            crime_multiplier=1.25,
            high_risk_zones=("commercial", "mixed", "residential"),
            low_risk_zones=(),
            elevated_categories=("property",),
            risk_categories=("hate",)
        ),
        Holiday(
            name="Eid ul-Adha",
            holiday_type="religious_muslim",
            date=date(year, 6, 17),  # Approximate
            duration_days=3,
            crime_multiplier=1.25,
            high_risk_zones=("commercial", "mixed", "slum"),
            low_risk_zones=(),
            elevated_categories=("property",),
            risk_categories=("hate",)
        ),
        Holiday(
            name="Muharram",
            holiday_type="religious_muslim",
            date=date(year, 7, 17),  # Approximate
            duration_days=2,
            crime_multiplier=1.15,
            high_risk_zones=("mixed", "slum"),
            low_risk_zones=("commercial", "residential"),
            elevated_categories=(),
            risk_categories=("hate", "violent")  # Processions can lead to tensions
        ),

        # Christian Holidays
        Holiday(
            name="Christmas",
            holiday_type="religious_christian",
            date=date(year, 12, 25),
            duration_days=2,
            crime_multiplier=1.2,
            high_risk_zones=("commercial", "mixed"),
            low_risk_zones=("slum",),
            elevated_categories=("property", "victimless"),
            risk_categories=()
        ),
        Holiday(
            name="Good Friday",
            holiday_type="religious_christian",
            date=date(year, 3, 29),  # Approximate
            duration_days=1,
            crime_multiplier=1.05,
            high_risk_zones=("mixed",),
            low_risk_zones=("commercial", "residential"),
            elevated_categories=(),
            risk_categories=()
        ),

        # Regional/Other
        Holiday(
            name="New Year",
            holiday_type="regional",
            date=date(year, 1, 1),
            duration_days=1,
            crime_multiplier=1.4,
            high_risk_zones=("commercial", "mixed", "residential", "transport"),
            low_risk_zones=(),
            elevated_categories=("violent", "victimless", "property"),
            risk_categories=()
        ),
        Holiday(
            name="Makar Sankranti",
            holiday_type="regional",
            date=date(year, 1, 14),
            duration_days=1,
            crime_multiplier=1.1,
            high_risk_zones=("mixed", "residential"),
            low_risk_zones=("commercial",),
            elevated_categories=("property",),
            risk_categories=()
        ),
    ]

    return holidays


def build_holiday_lookup(holidays: List[Holiday]) -> Dict[date, Holiday]:
    """Build a date -> holiday lookup including duration days."""
    lookup = {}
    for holiday in holidays:
        for day_offset in range(holiday.duration_days):
            holiday_date = holiday.date + timedelta(days=day_offset)
            # If multiple holidays overlap, keep the one with higher multiplier
            if holiday_date not in lookup or holiday.crime_multiplier > lookup[holiday_date].crime_multiplier:
                lookup[holiday_date] = holiday
    return lookup


# ===============================
# Indian Seasonal & Weather Config
# ===============================

@dataclass
class SeasonConfig:
    """Configuration for Indian seasons with weather probabilities."""
    name: str
    months: Tuple[int, ...]
    rain_prob: float
    fog_prob: float
    heatwave_prob: float
    temp_range: Tuple[float, float]  # Celsius


INDIAN_SEASONS: Dict[str, SeasonConfig] = {
    "winter": SeasonConfig(
        name="winter",
        months=(12, 1, 2),
        rain_prob=0.02,
        fog_prob=0.25,
        heatwave_prob=0.0,
        temp_range=(5, 20)
    ),
    "summer": SeasonConfig(
        name="summer",
        months=(3, 4, 5),
        rain_prob=0.05,
        fog_prob=0.02,
        heatwave_prob=0.15,
        temp_range=(25, 45)
    ),
    "monsoon": SeasonConfig(
        name="monsoon",
        months=(6, 7, 8, 9),
        rain_prob=0.55,
        fog_prob=0.05,
        heatwave_prob=0.0,
        temp_range=(22, 35)
    ),
    "post_monsoon": SeasonConfig(
        name="post_monsoon",
        months=(10, 11),
        rain_prob=0.10,
        fog_prob=0.10,
        heatwave_prob=0.0,
        temp_range=(18, 32)
    )
}

# ===============================
# Hour-Based Crime Multipliers
# ===============================

HOUR_MULTIPLIERS: Dict[Tuple[int, int], Dict[str, float]] = {
    (0, 4): {
        "violent": 1.4, "property": 1.3, "white_collar": 0.3,
        "victimless": 1.5, "organized": 1.2, "hate": 1.1
    },
    (5, 7): {
        "violent": 0.7, "property": 0.6, "white_collar": 0.5,
        "victimless": 0.5, "organized": 0.7, "hate": 0.6
    },
    (8, 10): {
        "violent": 0.8, "property": 0.9, "white_collar": 1.0,
        "victimless": 0.4, "organized": 0.8, "hate": 0.7
    },
    (11, 14): {
        "violent": 0.9, "property": 1.1, "white_collar": 1.4,
        "victimless": 0.5, "organized": 1.0, "hate": 0.8
    },
    (15, 17): {
        "violent": 1.0, "property": 1.2, "white_collar": 1.2,
        "victimless": 0.7, "organized": 1.1, "hate": 0.9
    },
    (18, 20): {
        "violent": 1.2, "property": 1.3, "white_collar": 0.8,
        "victimless": 1.2, "organized": 1.2, "hate": 1.1
    },
    (21, 23): {
        "violent": 1.3, "property": 1.2, "white_collar": 0.4,
        "victimless": 1.4, "organized": 1.1, "hate": 1.2
    }
}

# ===============================
# Helper Functions
# ===============================

def get_season(month: int) -> SeasonConfig:
    """Get Indian season configuration for given month."""
    for season in INDIAN_SEASONS.values():
        if month in season.months:
            return season
    raise ValueError(f"Invalid month: {month}")


def get_weather(season: SeasonConfig, rng: np.random.Generator) -> Dict[str, Any]:
    """Generate realistic weather based on Indian seasonal patterns."""
    r = rng.random()
    cumulative = 0.0

    weather_probs = [
        ("rain", season.rain_prob),
        ("fog", season.fog_prob),
        ("heatwave", season.heatwave_prob),
    ]

    weather_type = "clear"
    for wtype, prob in weather_probs:
        cumulative += prob
        if r < cumulative:
            weather_type = wtype
            break

    temp = rng.uniform(*season.temp_range)

    humidity_map = {
        "rain": rng.uniform(75, 95),
        "fog": rng.uniform(85, 100),
        "heatwave": rng.uniform(15, 35),
        "clear": rng.uniform(40, 70)
    }

    return {
        "type": weather_type,
        "temperature": round(temp, 1),
        "humidity": round(humidity_map[weather_type], 1)
    }


def get_hour_multiplier(hour: int) -> Dict[str, float]:
    """Get crime rate multipliers for given hour."""
    for (start, end), multipliers in HOUR_MULTIPLIERS.items():
        if start <= hour <= end:
            return multipliers
    return {cat: 1.0 for cat in CATEGORIES}


def sample_point_in_polygon(
    polygon_coords: List[List[float]],
    rng: np.random.Generator,
    max_attempts: int = 100
) -> Tuple[float, float]:
    """Sample a random point strictly inside a polygon using rejection sampling."""
    # polygon_coords is in [lat, lon] format, Shapely uses (x, y) = (lon, lat)
    coords = [(p[1], p[0]) for p in polygon_coords]
    polygon = Polygon(coords)
    
    if not polygon.is_valid:
        # Try to fix invalid polygon
        polygon = polygon.buffer(0)
    
    prepared_poly = prep(polygon)
    minx, miny, maxx, maxy = polygon.bounds

    for _ in range(max_attempts):
        lon = rng.uniform(minx, maxx)
        lat = rng.uniform(miny, maxy)
        point = Point(lon, lat)

        if prepared_poly.contains(point):
            return (lat, lon)

    # Fallback: return centroid
    centroid = polygon.centroid
    logger.warning("Rejection sampling failed, using centroid")
    return (centroid.y, centroid.x)


def normalize_zone(zone: Dict) -> Dict:
    """
    Normalize zone data from zones.json format to generator expected format.
    Handles field name mappings and crime rate key conversions.
    """
    normalized = zone.copy()
    
    # Map field names
    if "coords" in normalized and "polygon" not in normalized:
        normalized["polygon"] = normalized.pop("coords")
    
    # Map crime rate keys
    if "base_crime_rates" in normalized and "base_category_rates" not in normalized:
        old_rates = normalized.pop("base_crime_rates")
        new_rates = {}
        for old_key, value in old_rates.items():
            if old_key in CRIME_RATE_MAPPING:
                new_rates[CRIME_RATE_MAPPING[old_key]] = value
            else:
                logger.warning(f"Unknown crime rate key: {old_key}")
        normalized["base_category_rates"] = new_rates
    
    return normalized


def validate_zone(zone: Dict) -> bool:
    """Validate zone configuration has required fields."""
    required_fields = [
        "zone_id", "type", "polygon", "pop_density",
        "lighting", "cctv_density", "police_score",
        "crowd_base", "risk_base", "base_category_rates"
    ]

    for fld in required_fields:
        if fld not in zone:
            logger.error(f"Zone '{zone.get('zone_id', 'unknown')}' missing required field: {fld}")
            return False

    if len(zone["polygon"]) < 3:
        logger.error(f"Zone {zone['zone_id']} has invalid polygon (< 3 points)")
        return False

    if zone["type"] not in ZONE_TYPES:
        logger.warning(f"Zone {zone['zone_id']}: unknown type '{zone['type']}', will still process")

    if not (0 <= zone["lighting"] <= 1):
        logger.warning(f"Zone {zone['zone_id']}: lighting should be 0-1, got {zone['lighting']}")

    if not (0 <= zone["police_score"] <= 1):
        logger.warning(f"Zone {zone['zone_id']}: police_score should be 0-1, got {zone['police_score']}")

    return True


# ===============================
# Main Generator Class
# ===============================

class CrimeDataGenerator:
    """
    State-of-the-art synthetic crime data generator with:
    - Accurate spatio-temporal modeling
    - Indian seasonal/weather patterns
    - Holiday-aware crime modulation
    - Zone-type specific crime patterns
    - Robust probabilistic sampling
    """

    def __init__(
        self,
        zones: List[Dict],
        seed: Optional[int] = None,
        base_rate_scale: float = 1.0
    ):
        """Initialize the generator."""
        # Normalize and validate zones
        normalized_zones = [normalize_zone(z) for z in zones]
        self.zones = [z for z in normalized_zones if validate_zone(z)]
        self.base_rate_scale = base_rate_scale

        self.seed = seed
        self.rng = np.random.default_rng(seed)
        if seed is not None:
            random.seed(seed)

        # Pre-compute holiday lookup for common years
        self._holiday_cache: Dict[int, Dict[date, Holiday]] = {}

        logger.info(f"Initialized generator with {len(self.zones)} valid zones")
        
        # Log zone type distribution
        zone_types = {}
        for z in self.zones:
            zt = z["type"]
            zone_types[zt] = zone_types.get(zt, 0) + 1
        logger.info(f"Zone type distribution: {zone_types}")

    def _get_holiday_lookup(self, year: int) -> Dict[date, Holiday]:
        """Get or create holiday lookup for a year."""
        if year not in self._holiday_cache:
            holidays = generate_indian_holidays(year)
            self._holiday_cache[year] = build_holiday_lookup(holidays)
        return self._holiday_cache[year]

    def _compute_zone_modifiers(self, zone: Dict) -> Dict[str, float]:
        """Compute crime rate modifiers based on zone infrastructure."""
        lighting_mod = 1.0 + 0.3 * (1.0 - zone["lighting"])
        crowd_mod = 1.0 + 0.2 * (zone["crowd_base"] - 1.0)
        police_mod = 1.0 - 0.4 * zone["police_score"]
        cctv_mod = 1.0 - 0.2 * zone["cctv_density"]
        risk_mod = 1.0 + zone["risk_base"]

        return {
            "lighting": max(0.5, lighting_mod),
            "crowd": max(0.5, crowd_mod),
            "police": max(0.3, police_mod),
            "cctv": max(0.5, cctv_mod),
            "risk": risk_mod
        }

    def _compute_holiday_modifiers(
        self,
        holiday: Optional[Holiday],
        zone_type: str,
        category: str
    ) -> float:
        """
        Compute crime rate modifier based on holiday and zone type.
        
        Returns a multiplier that accounts for:
        - Overall holiday crime increase
        - Zone-specific risk (e.g., commercial areas during Diwali)
        - Category-specific elevation (e.g., property crime during festivals)
        """
        if holiday is None:
            return 1.0

        base_mult = holiday.crime_multiplier

        # Zone-type specific adjustments
        if zone_type in holiday.high_risk_zones:
            base_mult *= 1.3  # 30% more crime in high-risk zones
        elif zone_type in holiday.low_risk_zones:
            base_mult *= 0.6  # 40% less crime in low-risk zones

        # Category-specific adjustments
        if category in holiday.elevated_categories:
            base_mult *= 1.25  # 25% more for elevated categories
        if category in holiday.risk_categories:
            base_mult *= 1.4  # 40% more for risk categories (hate crimes, etc.)

        return base_mult

    def _compute_temporal_modifiers(
        self,
        hour: int,
        dow: int,
        weather: Dict,
        season: SeasonConfig,
        is_event: bool
    ) -> Dict[str, float]:
        """Compute crime rate modifiers based on temporal factors."""
        is_weekend = dow >= 5

        weather_mod = {
            "rain": 0.7,
            "fog": 1.1,
            "heatwave": 1.15,
            "clear": 1.0
        }.get(weather["type"], 1.0)

        weekend_mod = 1.25 if is_weekend else 1.0
        event_mod = 1.5 if is_event else 1.0
        festival_mod = 1.2 if season.name == "post_monsoon" else 1.0

        return {
            "weather": weather_mod,
            "weekend": weekend_mod,
            "event": event_mod,
            "festival": festival_mod
        }

    def _sample_crimes_for_zone(
        self,
        zone: Dict,
        hour_mult: Dict[str, float],
        zone_mods: Dict[str, float],
        temporal_mods: Dict[str, float],
        holiday: Optional[Holiday]
    ) -> List[Tuple[str, str]]:
        """Sample crimes for a zone using Poisson process."""
        base_rates = zone["base_category_rates"]
        zone_type = zone["type"]
        crimes = []

        for category in CATEGORIES:
            # Get base rate, default to small value if not present
            base = base_rates.get(category, 0.01) / 24.0

            rate = base * self.base_rate_scale
            rate *= hour_mult.get(category, 1.0)
            rate *= zone_mods["lighting"]
            rate *= zone_mods["crowd"]
            rate *= zone_mods["police"]
            rate *= zone_mods["risk"]

            if category == "property":
                rate *= zone_mods["cctv"]

            rate *= temporal_mods["weather"]
            rate *= temporal_mods["weekend"]
            rate *= temporal_mods["event"]
            rate *= temporal_mods["festival"]

            # Apply holiday modifier (zone-type and category aware)
            holiday_mod = self._compute_holiday_modifiers(holiday, zone_type, category)
            rate *= holiday_mod

            # Controlled noise
            rate *= max(0.5, self.rng.normal(1.0, 0.08))
            rate = max(0, rate)

            count = self.rng.poisson(rate)

            for _ in range(count):
                subtype = self.rng.choice(CRIME_SCHEMA[category])
                crimes.append((category, subtype))

        return crimes

    def generate(
        self,
        start: datetime,
        end: datetime,
        event_probability: float = 0.03
    ) -> pd.DataFrame:
        """Generate crime dataset for given time range."""
        logger.info(f"Generating data from {start} to {end}")

        # Pre-load holiday lookups for all years in range
        for year in range(start.year, end.year + 1):
            self._get_holiday_lookup(year)

        data = []
        ts = start
        total_hours = int((end - start).total_seconds() / 3600)
        processed = 0

        while ts <= end:
            hour = ts.hour
            dow = ts.weekday()
            month = ts.month
            current_date = ts.date()

            # Get holiday info
            holiday_lookup = self._get_holiday_lookup(ts.year)
            holiday = holiday_lookup.get(current_date, None)

            # Get seasonal and weather info
            season = get_season(month)
            weather = get_weather(season, self.rng)

            is_event = self.rng.random() < event_probability
            hour_mult = get_hour_multiplier(hour)

            temporal_mods = self._compute_temporal_modifiers(
                hour, dow, weather, season, is_event
            )

            for zone in self.zones:
                zone_mods = self._compute_zone_modifiers(zone)

                crimes = self._sample_crimes_for_zone(
                    zone, hour_mult, zone_mods, temporal_mods, holiday
                )

                for category, subtype in crimes:
                    lat, lon = sample_point_in_polygon(
                        zone["polygon"], self.rng
                    )

                    record = {
                        # Temporal
                        "timestamp": ts,
                        "hour": hour,
                        "day_of_week": dow,
                        "is_weekend": int(dow >= 5),
                        "month": month,

                        # Spatial
                        "zone_id": zone["zone_id"],
                        "zone_type": zone["type"],
                        "latitude": round(lat, 6),
                        "longitude": round(lon, 6),

                        # Crime info
                        "category": category,
                        "subtype": subtype,
                        "severity": SEVERITY_MAP[category],

                        # Environmental
                        "season": season.name,
                        "weather": weather["type"],
                        "temperature": weather["temperature"],
                        "humidity": weather["humidity"],
                        "is_event": int(is_event),

                        # Holiday info
                        "is_holiday": int(holiday is not None),
                        "holiday_name": holiday.name if holiday else None,
                        "holiday_type": holiday.holiday_type if holiday else None,

                        # Zone features
                        "pop_density": zone["pop_density"],
                        "crowd_level": zone["crowd_base"],
                        "lighting_score": zone["lighting"],
                        "cctv_density": zone["cctv_density"],
                        "police_presence": zone["police_score"]
                    }
                    data.append(record)

            processed += 1
            if processed % 1000 == 0:
                pct = (processed / total_hours) * 100
                logger.info(f"Processed {processed}/{total_hours} hours ({pct:.1f}%)")

            ts += timedelta(hours=1)

        df = pd.DataFrame(data)
        logger.info(f"Generated {len(df)} crime records")

        return df


# ===============================
# Runner
# ===============================

def main():
    """Main entry point."""
    try:
        with open("zones.json", "r", encoding="utf-8") as f:
            zones_data = json.load(f)
            zones = zones_data.get("zones", zones_data)
    except FileNotFoundError:
        logger.error("zones.json not found")
        return
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in zones.json: {e}")
        return

    generator = CrimeDataGenerator(
        zones=zones,
        seed=42,
        base_rate_scale=1.0
    )

    start = datetime(2024, 1, 1)
    end = datetime(2026, 1, 1)

    df = generator.generate(start, end, event_probability=0.03)

    output_path = "crime_dataset.csv"
    df.to_csv(output_path, index=False)
    logger.info(f"Saved to {output_path}")

    # Summary
    print("\n" + "=" * 50)
    print("GENERATION SUMMARY")
    print("=" * 50)
    print(f"Total Records: {len(df):,}")
    print(f"Date Range: {start.date()} to {end.date()}")
    print(f"Zones: {df['zone_id'].nunique()}")
    print("\nCrimes by Category:")
    print(df['category'].value_counts().to_string())
    print("\nCrimes by Zone Type:")
    print(df['zone_type'].value_counts().to_string())
    print("\nCrimes by Season:")
    print(df['season'].value_counts().to_string())
    print("\nHoliday vs Non-Holiday Crimes:")
    print(df['is_holiday'].value_counts().to_string())
    if df['holiday_type'].notna().any():
        print("\nCrimes by Holiday Type:")
        print(df[df['holiday_type'].notna()]['holiday_type'].value_counts().to_string())


if __name__ == "__main__":
    main()
