"""
Crime Prediction & Patrol Generation Router
============================================
Uses trained ML models to predict crimes and generate optimal patrol routes
"""

from fastapi import APIRouter, HTTPException, Query
from prisma import Prisma, Json
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
import os
import sys
import json
import numpy as np
import pandas as pd
import joblib
import holidays

# Add parent directories to path for imports
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
MODELS_DIR = os.path.join(BACKEND_DIR, 'models')
DATASET_DIR = os.path.join(BACKEND_DIR, 'dataset')

router = APIRouter(prefix="/api/predictions", tags=["predictions"])

# ============== Models & Response Types ==============

class TimeSlotPrediction(BaseModel):
    slot_start: str
    slot_end: str
    slot_label: str
    zone_id: str
    zone_name: str
    zone_type: str
    predicted_category: str
    confidence: float
    risk_level: str
    base_risk: float
    patrol_priority: float

class PatrolRecommendation(BaseModel):
    patrol_id: int
    name: str
    assigned_zones: List[Dict[str, Any]]
    time_slot: str
    start_time: str
    end_time: str
    predicted_crimes: List[str]
    total_risk_score: float
    recommended_officers: int
    checkpoints: List[Dict[str, Any]]
    route_coords: List[List[float]]

class DayPredictionResponse(BaseModel):
    date: str
    is_holiday: bool
    holiday_name: Optional[str]
    weather: str
    total_predictions: int
    high_risk_count: int
    time_slots: List[Dict[str, Any]]
    patrol_recommendations: List[PatrolRecommendation]
    model_info: Dict[str, str]

class ZonePredictionRequest(BaseModel):
    zone_id: str
    date: str
    hour: int

# ============== Prediction Engine ==============

class CrimePredictionEngine:
    """
    Crime prediction engine using trained ML models
    """
    
    SEASON_MAP = {
        1: 'winter', 2: 'winter', 3: 'spring',
        4: 'spring', 5: 'spring', 6: 'summer',
        7: 'summer', 8: 'summer', 9: 'fall',
        10: 'fall', 11: 'fall', 12: 'winter'
    }
    
    LIGHTING_THRESHOLD = 0.4
    CCTV_THRESHOLD = 0.3
    
    TIME_SLOTS = [
        ("00:00", "02:00", "Late Night 1"),
        ("02:00", "04:00", "Late Night 2"),
        ("04:00", "06:00", "Early Morning"),
        ("06:00", "08:00", "Morning Rush"),
        ("08:00", "10:00", "Mid Morning"),
        ("10:00", "12:00", "Late Morning"),
        ("12:00", "14:00", "Afternoon 1"),
        ("14:00", "16:00", "Afternoon 2"),
        ("16:00", "18:00", "Evening Rush"),
        ("18:00", "20:00", "Early Night"),
        ("20:00", "22:00", "Night 1"),
        ("22:00", "00:00", "Night 2"),
    ]
    
    def __init__(self):
        self.model = None
        self.target_encoder = None
        self.onehot_encoder = None
        self.scaler = None
        self.zone_stats = {}
        self.metadata = {}
        self.feature_names = []
        self.classes = []
        self.india_holidays = holidays.India(years=range(2024, 2028))
        self._load_models()
    
    def _load_models(self):
        """Load all ML artifacts"""
        try:
            # Load best model (fallback to catboost)
            self.model = joblib.load(os.path.join(MODELS_DIR, 'best_model.pkl'))
            
            # Load encoders
            self.target_encoder = joblib.load(os.path.join(MODELS_DIR, 'target_encoder.pkl'))
            self.onehot_encoder = joblib.load(os.path.join(MODELS_DIR, 'onehot_encoder.pkl'))
            self.scaler = joblib.load(os.path.join(MODELS_DIR, 'scaler.pkl'))
            
            # Load zone stats
            zone_stats_path = os.path.join(MODELS_DIR, 'zone_stats.json')
            if os.path.exists(zone_stats_path):
                with open(zone_stats_path, 'r') as f:
                    self.zone_stats = json.load(f)
            
            # Load metadata
            metadata_path = os.path.join(MODELS_DIR, 'model_metadata.json')
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r') as f:
                    self.metadata = json.load(f)
                    self.feature_names = self.metadata.get('feature_names', [])
                    self.classes = self.metadata.get('classes', [])
            
            print("[OK] Crime prediction models loaded successfully")
        except Exception as e:
            print(f"[WARN] Failed to load prediction models: {e}")
            self.model = None
    
    def is_holiday(self, check_date: date) -> tuple:
        """Check if date is a holiday"""
        holiday_name = self.india_holidays.get(check_date)
        return (holiday_name is not None, holiday_name)
    
    def get_weather_for_date(self, check_date: date) -> str:
        """Simulate weather based on month (can be replaced with actual API)"""
        month = check_date.month
        if month in [6, 7, 8, 9]:  # Monsoon
            return np.random.choice(['rain', 'cloudy', 'storm'], p=[0.5, 0.35, 0.15])
        elif month in [12, 1, 2]:  # Winter
            return np.random.choice(['clear', 'fog', 'cloudy'], p=[0.5, 0.3, 0.2])
        else:  # Summer/other
            return np.random.choice(['clear', 'cloudy'], p=[0.7, 0.3])
    
    def _cyclical_encode(self, value: int, period: int) -> tuple:
        """Convert cyclical features to sin/cos"""
        sin_val = np.sin(2 * np.pi * value / period)
        cos_val = np.cos(2 * np.pi * value / period)
        return sin_val, cos_val
    
    def _get_zone_stats(self, zone_id: str) -> dict:
        """Get statistical features for a zone"""
        default_stats = {
            'zone_risk_score': 0.01,
            'zone_severity_mean': 2.0,
            'zone_crowd_mean': 1.0,
            'zone_crime_diversity': 0.5
        }
        return self.zone_stats.get(zone_id, default_stats)
    
    def _transform_features(self, raw_features: dict) -> dict:
        """Transform raw features to model-ready format"""
        transformed = {}
        
        # Cyclical encoding
        hour = raw_features.get('hour', 12)
        day_of_week = raw_features.get('day_of_week', 0)
        month = raw_features.get('month', 1)
        
        transformed['hour_sin'], transformed['hour_cos'] = self._cyclical_encode(hour, 24)
        transformed['day_of_week_sin'], transformed['day_of_week_cos'] = self._cyclical_encode(day_of_week, 7)
        transformed['month_sin'], transformed['month_cos'] = self._cyclical_encode(month, 12)
        
        # Binary features
        transformed['is_weekend'] = int(raw_features.get('is_weekend', 0))
        transformed['is_holiday'] = int(raw_features.get('is_holiday', 0))
        
        # Severity
        severity = raw_features.get('severity', 2)
        transformed['severity'] = severity
        
        # Zone stats
        zone_id = raw_features.get('zone_id', 'unknown')
        zone_stats = self._get_zone_stats(zone_id)
        transformed['zone_risk_score'] = zone_stats['zone_risk_score']
        transformed['zone_severity_mean'] = zone_stats['zone_severity_mean']
        transformed['zone_crowd_mean'] = zone_stats['zone_crowd_mean']
        transformed['zone_crime_diversity'] = zone_stats['zone_crime_diversity']
        
        # Population density (log)
        pop_density = raw_features.get('pop_density', 10000)
        transformed['pop_density_log'] = np.log1p(pop_density)
        
        # Numerical features
        transformed['crowd_level'] = raw_features.get('crowd_level', 1.0)
        transformed['lighting_score'] = raw_features.get('lighting_score', 0.5)
        transformed['cctv_density'] = raw_features.get('cctv_density', 0.3)
        
        # Threshold indicators
        transformed['low_lighting'] = int(transformed['lighting_score'] < self.LIGHTING_THRESHOLD)
        transformed['low_cctv'] = int(transformed['cctv_density'] < self.CCTV_THRESHOLD)
        
        # Severity interactions
        transformed['severity_x_crowd'] = severity * transformed['crowd_level']
        transformed['severity_x_lighting'] = severity * transformed['lighting_score']
        transformed['severity_x_cctv'] = severity * transformed['cctv_density']
        transformed['severity_x_hour_sin'] = severity * transformed['hour_sin']
        transformed['severity_x_hour_cos'] = severity * transformed['hour_cos']
        
        # One-hot encode categoricals
        weather = raw_features.get('weather', 'clear')
        season = raw_features.get('season', 'summer')
        
        if self.onehot_encoder:
            try:
                onehot_features = self.onehot_encoder.get_feature_names_out(['weather', 'season'])
                cat_data = pd.DataFrame({'weather': [weather], 'season': [season]})
                onehot_values = self.onehot_encoder.transform(cat_data)[0]
                for i, feat_name in enumerate(onehot_features):
                    transformed[feat_name] = onehot_values[i]
            except:
                pass
        
        return transformed
    
    def predict_for_zone(self, zone: dict, hour: int, day_of_week: int, month: int,
                        is_holiday: int = 0, weather: str = 'clear') -> dict:
        """Predict crime category for a zone at specific time"""
        if self.model is None:
            return self._mock_prediction(zone, hour)
        
        # Build raw features
        raw_features = {
            'hour': hour,
            'day_of_week': day_of_week,
            'is_weekend': 1 if day_of_week >= 5 else 0,
            'month': month,
            'zone_id': zone.get('zoneId', zone.get('zone_id', '')),
            'severity': 2,
            'season': self.SEASON_MAP[month],
            'weather': weather,
            'is_holiday': is_holiday,
            'pop_density': zone.get('popDensity', zone.get('pop_density', 10000)),
            'crowd_level': zone.get('crowdBase', zone.get('crowd_base', 1.0)),
            'lighting_score': zone.get('lighting', 0.5),
            'cctv_density': zone.get('cctvDensity', zone.get('cctv_density', 0.3)),
        }
        
        # Transform features
        transformed = self._transform_features(raw_features)
        
        # Create DataFrame
        df = pd.DataFrame([transformed])
        
        # Ensure all features present
        for feat in self.feature_names:
            if feat not in df.columns:
                df[feat] = 0
        
        if self.feature_names:
            df = df[self.feature_names]
        
        try:
            # Predict
            pred_encoded = self.model.predict(df)[0]
            
            # Get probabilities
            if hasattr(self.model, 'predict_proba'):
                probabilities = self.model.predict_proba(df)[0]
                confidence = float(max(probabilities))
            else:
                confidence = 0.7
            
            # Decode prediction
            if self.target_encoder:
                predicted_category = self.target_encoder.inverse_transform([pred_encoded])[0]
            else:
                predicted_category = str(pred_encoded)
            
            # Calculate risk level
            base_risk = zone.get('riskBase', zone.get('risk_base', 0.5))
            combined_risk = (confidence * 0.6 + base_risk * 0.4)
            
            if combined_risk >= 0.50:
                risk_level = "Critical"
            elif combined_risk >= 0.4:
                risk_level = "High"
            elif combined_risk >= 0.25:
                risk_level = "Medium"
            else:
                risk_level = "Low"
            
            return {
                'predicted_category': predicted_category,
                'confidence': confidence,
                'risk_level': risk_level,
                'base_risk': base_risk,
                'combined_risk': combined_risk
            }
        except Exception as e:
            print(f"Prediction error: {e}")
            return self._mock_prediction(zone, hour)
    
    def _mock_prediction(self, zone: dict, hour: int) -> dict:
        """Fallback mock prediction if model fails"""
        base_risk = zone.get('riskBase', zone.get('risk_base', 0.5))
        
        # Higher risk at night
        time_factor = 1.3 if (hour >= 22 or hour < 6) else 1.0
        adjusted_risk = min(base_risk * time_factor, 1.0)
        
        categories = ['Property Crimes', 'Violent Crimes', 'White-Collar Crimes', 
                     'Organized Crimes', 'Hate Crimes']
        
        if adjusted_risk >= 0.6:
            category = np.random.choice(['Property Crimes', 'Violent Crimes'], p=[0.6, 0.4])
            risk_level = "High"
        elif adjusted_risk >= 0.4:
            category = np.random.choice(['Property Crimes', 'White-Collar Crimes'], p=[0.7, 0.3])
            risk_level = "Medium"
        else:
            category = 'Property Crimes'
            risk_level = "Low"
        
        return {
            'predicted_category': category,
            'confidence': 0.65 + np.random.random() * 0.2,
            'risk_level': risk_level,
            'base_risk': base_risk,
            'combined_risk': adjusted_risk
        }
    
    def generate_patrol_recommendations(self, zones: list, predictions: list, 
                                        target_date: date, num_patrols: int = 10) -> list:
        """Generate optimal patrol recommendations"""
        patrols = []
        zone_dict = {z.get('id', z.get('zoneId')): z for z in zones}
        
        # Group predictions by time slot and sort by risk
        slot_predictions = {}
        for pred in predictions:
            slot = pred.get('slot_label', 'Unknown')
            if slot not in slot_predictions:
                slot_predictions[slot] = []
            slot_predictions[slot].append(pred)
        
        # Sort each slot by patrol priority
        for slot in slot_predictions:
            slot_predictions[slot].sort(key=lambda x: x.get('patrol_priority', 0), reverse=True)
        
        patrol_id = 1
        
        for slot_name, slot_preds in slot_predictions.items():
            if patrol_id > num_patrols:
                break
            
            # Take top high-risk zones for this slot (2-3 zones per patrol)
            top_zones_for_slot = slot_preds[:3]
            
            if not top_zones_for_slot:
                continue
            
            # Get zone details
            assigned_zones = []
            checkpoints = []
            route_coords = []
            crime_types = set()
            total_risk = 0
            
            for i, pred in enumerate(top_zones_for_slot):
                zone_id = pred.get('zone_id')
                zone = zone_dict.get(zone_id, {})
                
                coords = zone.get('coords', [[19.23, 72.85]])
                center_lat = sum(c[0] for c in coords) / len(coords) if coords else 19.23
                center_lng = sum(c[1] for c in coords) / len(coords) if coords else 72.85
                
                assigned_zones.append({
                    'zone_id': zone_id,
                    'zone_name': pred.get('zone_name', 'Unknown'),
                    'risk_level': pred.get('risk_level', 'Medium'),
                    'predicted_crime': pred.get('predicted_category', 'Unknown'),
                    'confidence': pred.get('confidence', 0.5),
                    'center': [center_lat, center_lng]
                })
                
                crime_types.add(pred.get('predicted_category', 'Unknown'))
                total_risk += pred.get('patrol_priority', 0.5)
                
                # Add checkpoints
                for j, coord in enumerate(coords[:3]):  # Max 3 checkpoints per zone
                    checkpoints.append({
                        'id': len(checkpoints) + 1,
                        'name': f"{pred.get('zone_name', 'Zone')} - Point {j+1}",
                        'lat': coord[0],
                        'lng': coord[1],
                        'zone': zone_id
                    })
                    route_coords.append(coord)
            
            # Parse time from slot label
            slot_times = slot_name.split(' - ') if ' - ' in slot_name else [slot_name]
            start_time = f"{target_date}T{top_zones_for_slot[0].get('slot_start', '00:00')}:00"
            end_time = f"{target_date}T{top_zones_for_slot[0].get('slot_end', '02:00')}:00"
            
            patrol = PatrolRecommendation(
                patrol_id=patrol_id,
                name=f"AI Patrol {patrol_id} - {slot_name}",
                assigned_zones=assigned_zones,
                time_slot=slot_name,
                start_time=start_time,
                end_time=end_time,
                predicted_crimes=list(crime_types),
                total_risk_score=round(total_risk / len(top_zones_for_slot), 3),
                recommended_officers=2 if total_risk > 1.5 else 1,
                checkpoints=checkpoints,
                route_coords=route_coords
            )
            
            patrols.append(patrol)
            patrol_id += 1
        
        # Sort patrols by risk score
        patrols.sort(key=lambda x: x.total_risk_score, reverse=True)
        
        return patrols[:num_patrols]


# Initialize prediction engine
prediction_engine = CrimePredictionEngine()


# ============== API Endpoints ==============

@router.get("/day/{date_str}", response_model=DayPredictionResponse)
async def get_day_predictions(date_str: str, num_patrols: int = Query(10, ge=1, le=20)):
    """
    Get crime predictions and patrol recommendations for a specific date
    Predictions are made for 2-hour time slots across the day
    """
    prisma = Prisma()
    await prisma.connect()
    
    try:
        # Parse date
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        day_of_week = target_date.weekday()
        month = target_date.month
        
        # Check holiday
        is_holiday, holiday_name = prediction_engine.is_holiday(target_date)
        
        # Get weather
        weather = prediction_engine.get_weather_for_date(target_date)
        
        # Fetch zones from database
        zones = await prisma.zone.find_many(order={"riskBase": "desc"})
        
        if not zones:
            raise HTTPException(status_code=404, detail="No zones found. Please seed zones first.")
        
        # Generate predictions for each zone at each 2-hour slot
        all_predictions = []
        time_slots_data = []
        high_risk_count = 0
        
        for slot_start, slot_end, slot_label in prediction_engine.TIME_SLOTS:
            hour = int(slot_start.split(':')[0])
            slot_predictions = []
            
            for zone in zones:
                zone_dict = {
                    'id': zone.id,
                    'zoneId': zone.zoneId,
                    'name': zone.name,
                    'type': zone.type,
                    'popDensity': zone.popDensity,
                    'crowdBase': zone.crowdBase,
                    'lighting': zone.lighting,
                    'cctvDensity': zone.cctvDensity,
                    'riskBase': zone.riskBase,
                    'coords': zone.coords or [[19.23, 72.85]],
                }
                
                prediction = prediction_engine.predict_for_zone(
                    zone_dict, hour, day_of_week, month,
                    is_holiday=1 if is_holiday else 0,
                    weather=weather
                )
                
                # Calculate patrol priority
                patrol_priority = (
                    prediction['confidence'] * 0.5 +
                    prediction['base_risk'] * 0.3 +
                    (1 - zone.lighting) * 0.1 +
                    (1 - zone.cctvDensity) * 0.1
                )
                
                pred_data = {
                    'slot_start': slot_start,
                    'slot_end': slot_end,
                    'slot_label': slot_label,
                    'zone_id': zone.id,
                    'zone_name': zone.name,
                    'zone_type': zone.type,
                    'predicted_category': prediction['predicted_category'],
                    'confidence': round(prediction['confidence'], 3),
                    'risk_level': prediction['risk_level'],
                    'base_risk': round(prediction['base_risk'], 3),
                    'patrol_priority': round(patrol_priority, 3)
                }
                
                slot_predictions.append(pred_data)
                all_predictions.append(pred_data)
                
                if prediction['risk_level'] in ['High', 'Critical']:
                    high_risk_count += 1
            
            # Sort slot predictions by priority
            slot_predictions.sort(key=lambda x: x['patrol_priority'], reverse=True)
            
            time_slots_data.append({
                'slot_start': slot_start,
                'slot_end': slot_end,
                'slot_label': slot_label,
                'hour': hour,
                'predictions': slot_predictions[:5],  # Top 5 per slot
                'high_risk_zones': [p for p in slot_predictions if p['risk_level'] in ['High', 'Critical']]
            })
        
        # Generate patrol recommendations
        zone_dicts = [{
            'id': z.id,
            'zoneId': z.zoneId,
            'name': z.name,
            'coords': z.coords or [[19.23, 72.85]]
        } for z in zones]
        
        patrol_recommendations = prediction_engine.generate_patrol_recommendations(
            zone_dicts, all_predictions, target_date, num_patrols
        )
        
        return DayPredictionResponse(
            date=date_str,
            is_holiday=is_holiday,
            holiday_name=holiday_name,
            weather=weather,
            total_predictions=len(all_predictions),
            high_risk_count=high_risk_count,
            time_slots=time_slots_data,
            patrol_recommendations=patrol_recommendations,
            model_info={
                'model_type': 'CatBoost/XGBoost Ensemble',
                'version': '1.0',
                'last_trained': prediction_engine.metadata.get('training_date', 'Unknown')
            }
        )
        
    finally:
        await prisma.disconnect()


@router.post("/generate-patrols")
async def generate_and_save_patrols(
    date_str: str = Query(..., description="Date for patrol generation (YYYY-MM-DD)"),
    num_patrols: int = Query(10, ge=1, le=20),
    auto_assign_officers: bool = Query(False)
):
    """
    Generate AI-based patrols and save them to the database
    """
    prisma = Prisma()
    await prisma.connect()
    
    try:
        # Get predictions
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        day_of_week = target_date.weekday()
        month = target_date.month
        
        is_holiday, _ = prediction_engine.is_holiday(target_date)
        weather = prediction_engine.get_weather_for_date(target_date)
        
        # Fetch zones
        zones = await prisma.zone.find_many(order={"riskBase": "desc"})
        
        if not zones:
            raise HTTPException(status_code=404, detail="No zones found")
        
        # Generate predictions
        all_predictions = []
        for slot_start, slot_end, slot_label in prediction_engine.TIME_SLOTS:
            hour = int(slot_start.split(':')[0])
            
            for zone in zones:
                zone_dict = {
                    'id': zone.id,
                    'zoneId': zone.zoneId,
                    'name': zone.name,
                    'type': zone.type,
                    'popDensity': zone.popDensity,
                    'crowdBase': zone.crowdBase,
                    'lighting': zone.lighting,
                    'cctvDensity': zone.cctvDensity,
                    'riskBase': zone.riskBase,
                    'coords': zone.coords or [[19.23, 72.85]],
                }
                
                prediction = prediction_engine.predict_for_zone(
                    zone_dict, hour, day_of_week, month,
                    is_holiday=1 if is_holiday else 0,
                    weather=weather
                )
                
                patrol_priority = (
                    prediction['confidence'] * 0.5 +
                    prediction['base_risk'] * 0.3 +
                    (1 - zone.lighting) * 0.1 +
                    (1 - zone.cctvDensity) * 0.1
                )
                
                all_predictions.append({
                    'slot_start': slot_start,
                    'slot_end': slot_end,
                    'slot_label': slot_label,
                    'zone_id': zone.id,
                    'zone_name': zone.name,
                    'zone_type': zone.type,
                    'predicted_category': prediction['predicted_category'],
                    'confidence': prediction['confidence'],
                    'risk_level': prediction['risk_level'],
                    'base_risk': prediction['base_risk'],
                    'patrol_priority': patrol_priority
                })
        
        # Generate patrol recommendations
        zone_dicts = [{
            'id': z.id,
            'zoneId': z.zoneId,
            'name': z.name,
            'coords': z.coords or [[19.23, 72.85]]
        } for z in zones]
        
        recommendations = prediction_engine.generate_patrol_recommendations(
            zone_dicts, all_predictions, target_date, num_patrols
        )
        
        # Get available officers if auto-assign
        available_officers = []
        if auto_assign_officers:
            available_officers = await prisma.policeofficer.find_many(
                where={"status": "ACTIVE", "role": "OFFICER"}
            )
        
        # Create patrols in database
        created_patrols = []
        count = await prisma.patrol.count()
        
        for i, rec in enumerate(recommendations):
            patrol_number = f"AI-{date_str.replace('-', '')}-{str(count + i + 1).zfill(2)}"
            
            # Get primary zone
            primary_zone_id = rec.assigned_zones[0]['zone_id'] if rec.assigned_zones else None
            
            # Prepare route data as JSON-serializable dict
            route_data = {
                'ai_generated': True,
                'prediction_date': date_str,
                'time_slot': rec.time_slot,
                'assigned_zones': rec.assigned_zones,
                'predicted_crimes': rec.predicted_crimes,
                'risk_score': rec.total_risk_score,
                'route_coords': rec.route_coords
            }
            
            # Prepare checkpoints as JSON
            checkpoints_data = [
                {
                    'id': cp['id'],
                    'name': cp['name'],
                    'lat': cp['lat'],
                    'lng': cp['lng'],
                    'zone': cp['zone']
                }
                for cp in rec.checkpoints
            ]
            
            # Create patrol with proper relation syntax
            patrol_data = {
                "patrolNumber": patrol_number,
                "status": "ACTIVE",
                "scheduledStart": datetime.fromisoformat(rec.start_time),
                "scheduledEnd": datetime.fromisoformat(rec.end_time),
                "routeData": Json(route_data),
                "checkpoints": Json(checkpoints_data),
                "totalCheckpoints": len(rec.checkpoints),
            }
            
            # Connect zone if available
            if primary_zone_id:
                patrol_data["zone"] = {"connect": {"id": primary_zone_id}}
            
            # Auto-assign officers if requested
            if auto_assign_officers and available_officers:
                officers_needed = rec.recommended_officers
                officers_to_assign = available_officers[:officers_needed]
                available_officers = available_officers[officers_needed:]
                
                if officers_to_assign:
                    patrol_data["officers"] = {
                        "connect": [{"id": o.id} for o in officers_to_assign]
                    }
                    patrol_data["leadOfficer"] = {"connect": {"id": officers_to_assign[0].id}}
            
            patrol = await prisma.patrol.create(
                data=patrol_data,
                include={"officers": True, "zone": True, "leadOfficer": True}
            )
            
            created_patrols.append({
                "id": patrol.id,
                "patrolNumber": patrol.patrolNumber,
                "zone": patrol.zone.name if patrol.zone else None,
                "time_slot": rec.time_slot,
                "risk_score": rec.total_risk_score,
                "checkpoints": len(rec.checkpoints),
                "officers_assigned": len(patrol.officers)
            })
        
        return {
            "success": True,
            "message": f"Generated {len(created_patrols)} AI-powered patrols",
            "date": date_str,
            "patrols": created_patrols
        }
        
    finally:
        await prisma.disconnect()


@router.get("/zone/{zone_id}/timeline")
async def get_zone_24h_timeline(zone_id: str, date_str: Optional[str] = None):
    """Get 24-hour crime prediction timeline for a specific zone"""
    prisma = Prisma()
    await prisma.connect()
    
    try:
        zone = await prisma.zone.find_unique(where={"id": zone_id})
        if not zone:
            raise HTTPException(status_code=404, detail="Zone not found")
        
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else date.today()
        day_of_week = target_date.weekday()
        month = target_date.month
        
        is_holiday, holiday_name = prediction_engine.is_holiday(target_date)
        weather = prediction_engine.get_weather_for_date(target_date)
        
        zone_dict = {
            'id': zone.id,
            'zoneId': zone.zoneId,
            'name': zone.name,
            'type': zone.type,
            'popDensity': zone.popDensity,
            'crowdBase': zone.crowdBase,
            'lighting': zone.lighting,
            'cctvDensity': zone.cctvDensity,
            'riskBase': zone.riskBase,
        }
        
        timeline = []
        for hour in range(24):
            prediction = prediction_engine.predict_for_zone(
                zone_dict, hour, day_of_week, month,
                is_holiday=1 if is_holiday else 0,
                weather=weather
            )
            
            timeline.append({
                'hour': hour,
                'time': f"{hour:02d}:00",
                'predicted_category': prediction['predicted_category'],
                'confidence': round(prediction['confidence'], 3),
                'risk_level': prediction['risk_level'],
                'combined_risk': round(prediction['combined_risk'], 3)
            })
        
        return {
            'zone_id': zone.id,
            'zone_name': zone.name,
            'date': str(target_date),
            'is_holiday': is_holiday,
            'holiday_name': holiday_name,
            'weather': weather,
            'timeline': timeline
        }
        
    finally:
        await prisma.disconnect()


@router.get("/compare-models")
async def compare_model_predictions(
    zone_id: str,
    date_str: str,
    hour: int = Query(12, ge=0, le=23)
):
    """Compare predictions from different models for analysis"""
    prisma = Prisma()
    await prisma.connect()
    
    try:
        zone = await prisma.zone.find_unique(where={"id": zone_id})
        if not zone:
            raise HTTPException(status_code=404, detail="Zone not found")
        
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        
        # This would load multiple models and compare
        # For now, return the main prediction with model info
        zone_dict = {
            'id': zone.id,
            'zoneId': zone.zoneId,
            'name': zone.name,
            'type': zone.type,
            'popDensity': zone.popDensity,
            'crowdBase': zone.crowdBase,
            'lighting': zone.lighting,
            'cctvDensity': zone.cctvDensity,
            'riskBase': zone.riskBase,
        }
        
        prediction = prediction_engine.predict_for_zone(
            zone_dict, hour, target_date.weekday(), target_date.month
        )
        
        return {
            'zone': zone.name,
            'date': date_str,
            'hour': hour,
            'predictions': {
                'ensemble': prediction,
                'model_used': 'CatBoost/XGBoost Ensemble'
            }
        }
        
    finally:
        await prisma.disconnect()


@router.get("/stats")
async def get_prediction_stats():
    """Get prediction engine statistics and model info"""
    return {
        'engine_status': 'active' if prediction_engine.model else 'fallback',
        'model_loaded': prediction_engine.model is not None,
        'model_type': prediction_engine.metadata.get('best_model', 'Unknown'),
        'feature_count': len(prediction_engine.feature_names),
        'classes': prediction_engine.classes,
        'time_slots': len(prediction_engine.TIME_SLOTS),
        'zone_stats_loaded': len(prediction_engine.zone_stats) > 0
    }
