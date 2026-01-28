import csv
from collections import defaultdict
from typing import List, Dict
from fastapi import APIRouter, HTTPException
import os

router = APIRouter(prefix="/api/hotspots", tags=["hotspots"])

def load_crime_data():
    """Load and aggregate crime data from CSV"""
    csv_path = os.path.join(os.path.dirname(__file__), "../dataset/crime_dataset.csv")
    
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="Crime dataset not found")
    
    zone_data = defaultdict(lambda: {
        "incidents": [],
        "risk_sum": 0,
        "severity_sum": 0,
        "count": 0,
        "coordinates": None,
        "crimes_by_type": defaultdict(int)
    })
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                zone_id = row.get('zone_id', 'Unknown')
                
                # Store first occurrence coordinates
                if zone_data[zone_id]["coordinates"] is None:
                    try:
                        zone_data[zone_id]["coordinates"] = {
                            "latitude": float(row.get('latitude', 0)),
                            "longitude": float(row.get('longitude', 0))
                        }
                    except (ValueError, TypeError):
                        pass
                
                # Parse severity
                try:
                    severity = int(row.get('severity', 1))
                except (ValueError, TypeError):
                    severity = 1
                
                zone_data[zone_id]["incidents"].append({
                    "category": row.get('category', 'Unknown'),
                    "subtype": row.get('subtype', 'Unknown'),
                    "severity": severity,
                    "timestamp": row.get('timestamp', ''),
                    "zone_type": row.get('zone_type', 'Unknown')
                })
                
                zone_data[zone_id]["risk_sum"] += severity
                zone_data[zone_id]["severity_sum"] += severity
                zone_data[zone_id]["count"] += 1
                
                crime_subtype = row.get('subtype', 'Unknown')
                zone_data[zone_id]["crimes_by_type"][crime_subtype] += 1
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading CSV: {str(e)}")
    
    return zone_data

def calculate_risk_score(zone_info: Dict) -> int:
    """Calculate risk score based on incident count and severity"""
    if zone_info["count"] == 0:
        return 0
    avg_severity = zone_info["severity_sum"] / zone_info["count"]
    # Normalize: (count * avg_severity) with cap at 100
    risk = min(int((zone_info["count"] * avg_severity) / 5), 100)
    return max(risk, 10)  # Minimum 10

def get_risk_trend(zone_info: Dict) -> str:
    """Determine risk trend based on recent incidents"""
    if zone_info["count"] < 5:
        return "+5%"  # Default for small samples
    
    # Calculate average severity
    avg_severity = zone_info["severity_sum"] / zone_info["count"]
    
    if avg_severity >= 3.5:
        return "+15%"
    elif avg_severity >= 3:
        return "+10%"
    else:
        return "-5%"

@router.get("/data")
def get_hotspots() -> List[Dict]:
    """Fetch aggregated hotspot data from crime dataset"""
    zone_data = load_crime_data()
    
    hotspots = []
    
    for zone_id, data in zone_data.items():
        if data["coordinates"] is None:
            continue
        
        risk_score = calculate_risk_score(data)
        top_crime = max(data["crimes_by_type"].items(), key=lambda x: x[1])[0] if data["crimes_by_type"] else "Unknown"
        trend = get_risk_trend(data)
        
        # Convert coordinates to map positions (0-100%)
        lat = data["coordinates"]["latitude"]
        lon = data["coordinates"]["longitude"]
        
        # Mumbai approximate bounds
        min_lat, max_lat = 19.0, 19.3
        min_lon, max_lon = 72.8, 72.95
        
        map_top = max(0, min(100, ((max_lat - lat) / (max_lat - min_lat)) * 100))
        map_left = max(0, min(100, ((lon - min_lon) / (max_lon - min_lon)) * 100))
        
        hotspot = {
            "id": len(hotspots) + 1,
            "name": zone_id.replace("_", " ").title(),
            "zone_id": zone_id,
            "risk": risk_score,
            "crimeCount": data["count"],
            "trend": trend,
            "topCrime": top_crime.replace("_", " ").title(),
            "status": "High Risk" if risk_score >= 70 else "Medium Risk" if risk_score >= 50 else "Low Risk",
            "coordinates": {
                "latitude": lat,
                "longitude": lon,
                "top": f"{map_top}%",
                "left": f"{map_left}%"
            },
            "timeActive": "Peak: 6PM-12AM",  # Can be enhanced with real data
            "zoneType": data["incidents"][0]["zone_type"] if data["incidents"] else "Unknown",
            "incidentCount": data["count"],
            "averageSeverity": round(data["severity_sum"] / data["count"], 2) if data["count"] > 0 else 0
        }
        
        hotspots.append(hotspot)
    
    # Sort by risk score descending
    hotspots.sort(key=lambda x: x["risk"], reverse=True)
    
    # Limit to top hotspots for better visualization
    return hotspots[:15]

@router.get("/all-coordinates")
def get_all_unique_coordinates() -> List[Dict]:
    """Fetch all unique crime coordinates from dataset"""
    csv_path = os.path.join(os.path.dirname(__file__), "../dataset/crime_dataset.csv")
    
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="Crime dataset not found")
    
    unique_coords = {}  # Use dict to track unique coordinates
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    lat = float(row.get('latitude', 0))
                    lon = float(row.get('longitude', 0))
                    severity = int(row.get('severity', 1))
                    category = row.get('category', 'Unknown')
                    
                    # Create unique key for this coordinate
                    key = f"{lat:.6f},{lon:.6f}"
                    
                    if key not in unique_coords:
                        unique_coords[key] = {
                            "latitude": lat,
                            "longitude": lon,
                            "severity": severity,
                            "category": category,
                            "count": 1
                        }
                    else:
                        # Update count and use average severity
                        unique_coords[key]["count"] += 1
                        unique_coords[key]["severity"] = (unique_coords[key]["severity"] + severity) / 2
                
                except (ValueError, TypeError):
                    continue
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading CSV: {str(e)}")
    
    # Convert to list
    coordinates_list = list(unique_coords.values())
    
    return coordinates_list

@router.get("/crimes")
def get_all_crimes() -> List[Dict]:
    """Fetch all individual crime records from dataset for map plotting"""
    csv_path = os.path.join(os.path.dirname(__file__), "../dataset/crime_dataset.csv")
    
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="Crime dataset not found")
    
    crimes = []
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                try:
                    crime = {
                        "id": i + 1,
                        "timestamp": row.get('timestamp', ''),
                        "hour": int(row.get('hour', 0)),
                        "dayOfWeek": int(row.get('day_of_week', 0)),
                        "isWeekend": bool(int(row.get('is_weekend', 0))),
                        "month": int(row.get('month', 1)),
                        "zoneId": row.get('zone_id', 'Unknown'),
                        "zoneType": row.get('zone_type', 'Unknown'),
                        "latitude": float(row.get('latitude', 0)),
                        "longitude": float(row.get('longitude', 0)),
                        "category": row.get('category', 'Unknown'),
                        "subtype": row.get('subtype', 'Unknown'),
                        "severity": int(row.get('severity', 1)),
                        "season": row.get('season', 'Unknown'),
                        "weather": row.get('weather', 'Unknown'),
                        "isHoliday": bool(int(row.get('is_holiday', 0))),
                        "holidayName": row.get('holiday_name', ''),
                    }
                    crimes.append(crime)
                except (ValueError, TypeError) as e:
                    continue
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading CSV: {str(e)}")
    
    return crimes

@router.get("/crimes/summary")
def get_crimes_summary() -> Dict:
    """Get summary statistics for crimes by zone, category, time etc."""
    csv_path = os.path.join(os.path.dirname(__file__), "../dataset/crime_dataset.csv")
    
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="Crime dataset not found")
    
    stats = {
        "totalCrimes": 0,
        "byCategory": defaultdict(int),
        "byZone": defaultdict(lambda: {"count": 0, "avgSeverity": 0, "severitySum": 0}),
        "byHour": defaultdict(int),
        "bySeverity": defaultdict(int),
        "byWeather": defaultdict(int),
    }
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                stats["totalCrimes"] += 1
                
                category = row.get('category', 'Unknown')
                zone_id = row.get('zone_id', 'Unknown')
                hour = int(row.get('hour', 0))
                severity = int(row.get('severity', 1))
                weather = row.get('weather', 'Unknown')
                
                stats["byCategory"][category] += 1
                stats["byZone"][zone_id]["count"] += 1
                stats["byZone"][zone_id]["severitySum"] += severity
                stats["byHour"][hour] += 1
                stats["bySeverity"][severity] += 1
                stats["byWeather"][weather] += 1
        
        # Calculate average severity per zone
        for zone_id, data in stats["byZone"].items():
            if data["count"] > 0:
                data["avgSeverity"] = round(data["severitySum"] / data["count"], 2)
            del data["severitySum"]
        
        # Convert defaultdicts to regular dicts for JSON serialization
        stats["byCategory"] = dict(stats["byCategory"])
        stats["byZone"] = dict(stats["byZone"])
        stats["byHour"] = dict(stats["byHour"])
        stats["bySeverity"] = dict(stats["bySeverity"])
        stats["byWeather"] = dict(stats["byWeather"])
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading CSV: {str(e)}")
    
    return stats

@router.get("/stats")
def get_hotspot_stats() -> Dict:
    """Get summary statistics about hotspots"""
    zone_data = load_crime_data()
    
    total_incidents = sum(data["count"] for data in zone_data.values())
    high_risk_zones = sum(1 for data in zone_data.values() if calculate_risk_score(data) >= 70)
    
    return {
        "totalIncidents": total_incidents,
        "totalZones": len(zone_data),
        "highRiskZones": high_risk_zones,
        "averageSeverity": round(sum(data["severity_sum"] for data in zone_data.values()) / total_incidents, 2) if total_incidents > 0 else 0
    }
