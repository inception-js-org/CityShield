# CityShield 🛡️

**AI-Powered Predictive Policing & Real-Time Crime Management System**

CityShield is a comprehensive crime prediction and law enforcement management platform that leverages machine learning to forecast crime patterns, optimize patrol routes, and provide real-time situational awareness for police departments.

---

## 🌟 Features

### 🤖 AI-Powered Crime Prediction
- **Multi-Model Ensemble**: Utilizes XGBoost, LightGBM, CatBoost, and Random Forest models
- **Subtype-Level Predictions**: Predicts specific crime types (not just categories)
- **Temporal Analysis**: Hour-by-hour, day-of-week, and seasonal crime forecasting
- **Spatial Intelligence**: Zone-based predictions with population density consideration
- **Environmental Factors**: Incorporates weather, events, holidays, and infrastructure data

### 🗺️ Smart Patrol Management
- **AI-Optimized Routes**: Generate patrol routes based on predicted crime hotspots
- **Real-Time Tracking**: Live officer location monitoring with Google Maps integration
- **Dynamic Allocation**: Automatic assignment based on crime risk levels
- **Historical Analytics**: Track patrol effectiveness and coverage metrics

### 🚨 Crime Hotspot Detection
- **Real-Time Visualization**: Interactive heat maps showing high-risk areas
- **Risk Scoring**: Zone-based threat assessment with dynamic updates
- **Alert Generation**: Automatic notifications for emerging hotspots
- **Multi-Factor Analysis**: Combines historical data, predictions, and live reports

### 📊 Comprehensive Dashboards
- **Admin Portal**: Full system oversight with analytics and management tools
- **Officer Interface**: Mobile-friendly patrol dashboard with live alerts
- **Real-Time Metrics**: Active crimes, complaint status, patrol efficiency
- **Visual Analytics**: Interactive charts, graphs, and geographic visualizations

### 📝 Incident Management
- **FIR (First Information Report) System**: Complete digital incident reporting
- **Complaint Tracking**: Public complaint submission and status monitoring
- **Evidence Management**: Document and media attachment support
- **Status Workflows**: From registration to investigation to resolution

### 👮 Officer Management
- **Clerk Integration**: Secure authentication and role-based access control
- **Team Coordination**: Multi-officer patrol assignment and communication
- **Performance Tracking**: Patrol history, response times, and case closures
- **Webhook Integration**: Automated officer onboarding and profile syncing

### 🔔 Real-Time Alerts
- **Proximity-Based**: Alert officers near reported incidents
- **Priority Levels**: Critical, high, medium, low classification
- **Status Tracking**: Acknowledged, responding, resolved states
- **Push Notifications**: Instant alerts to active patrol units

---

## 🧠 Machine Learning Models

### Training Dataset
The models were trained on a comprehensive crime dataset with **15,000+ incidents** featuring:

**Temporal Features:**
- Hour of day (0-23)
- Day of week (Monday-Sunday)
- Month and season
- Weekend/holiday indicators

**Spatial Features:**
- Zone ID and zone type (residential, commercial, industrial, mixed)
- Population density levels
- Geographic coordinates

**Environmental Features:**
- Weather conditions (clear, rainy, foggy, etc.)
- Event presence (festivals, concerts, sports)
- Holiday types and special occasions

**Infrastructure Features:**
- Lighting score (0.0-1.0)
- CCTV density (cameras per sq km)
- Police presence intensity
- Crowd levels

### Model Performance Comparison

```
================================================================================
       Model  Test Acc  Balanced Acc  Precision   Recall  F1 Score    Kappa
================================================================================
     XGBoost  0.692409      0.739380   0.943291 0.692409  0.776924 0.530330
    LightGBM  0.695247      0.734585   0.942313 0.695247  0.779524 0.531003
    CatBoost  0.769231      0.715876   0.935831 0.769231  0.833452 0.611929
RandomForest  0.851221      0.704536   0.932325 0.851221  0.885640 0.720747
================================================================================
```

**Best Performer: Random Forest** (85.1% accuracy, F1: 0.886)
- Excellent handling of categorical features
- Robust to noise and outliers
- High precision (93.2%) minimizes false alarms

**Production Deployment:** Uses ensemble approach combining all four models for maximum reliability.

### Model Capabilities
- **Real-Time Inference**: Sub-second prediction times
- **Batch Processing**: Daily forecasts for entire city zones
- **Feature Importance**: Identifies key crime drivers (time, location, weather)
- **Class Imbalance Handling**: SMOTE resampling for rare crime types
- **Continuous Learning**: Models retrained monthly with new incident data

---

## 🏗️ Technology Stack

### Backend
- **FastAPI**: High-performance Python API framework
- **Prisma**: Next-generation ORM for PostgreSQL
- **XGBoost/LightGBM/CatBoost**: Production ML models
- **Scikit-learn**: Data preprocessing and validation
- **Pandas/NumPy**: Data manipulation and analysis

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Shadcn/ui**: Premium component library
- **Google Maps API**: Interactive mapping
- **Recharts**: Data visualization

### Infrastructure
- **PostgreSQL**: Relational database
- **Clerk**: Authentication & user management
- **ngrok**: Secure tunneling for webhooks
- **Conda**: Python environment management

---

## 🚀 Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Conda
- ngrok account

### 1️⃣ Clone Repository

```bash
git clone <your-repo-url>
cd CityShield
```

### 2️⃣ Backend Setup

**Create Python Environment:**
```bash
conda create -n hackEnv python=3.10
conda activate hackEnv
```

**Install Python Dependencies:**
```bash
pip install fastapi uvicorn prisma pydantic pydantic-settings httpx python-dotenv "pydantic[email]"
pip install xgboost lightgbm catboost scikit-learn pandas numpy joblib
```

**Install Node.js Dependencies (for Prisma):**
```bash
npm install
npm install prisma --save-dev
```

### 3️⃣ Environment Configuration

**Create Environment File:**
```bash
copy .env.example .env
```

**Required Environment Variables:**
```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME
CLERK_SECRET_KEY=sk_test_xxxxxxxxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxx
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### 4️⃣ Database Setup

**Generate Prisma Client:**
```bash
npx prisma generate
```

**Run Migrations:**
```bash
npx prisma migrate dev
```

**For Version Mismatch:**
```bash
npx prisma@5.8.0 generate
```

### 5️⃣ Start Backend Server

```bash
cd backend
python -m uvicorn app:app --reload
```

**Verify Backend:**
```bash
curl http://localhost:8000/health
```

Expected response: `{"status":"healthy","service":"hackdeck-api"}`

### 6️⃣ Configure Webhooks

**Install ngrok:**
```bash
ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN
```

**Start Tunnel:**
```bash
ngrok http 8000
```

**Copy the HTTPS forwarding URL** (e.g., `https://abc123.ngrok-free.app`)

**Add to Clerk Dashboard:**
```
https://<ngrok-id>.ngrok-free.app/api/officers/webhooks/clerk
```

⚠️ **Important:** Use `/clerk` NOT `/clerki`

**Restart Backend:**
```bash
taskkill /F /IM python.exe
python -m uvicorn app:app --reload
```

### 7️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Access at: `http://localhost:3000`

### 8️⃣ Test API Endpoints

**Invite Officer:**
```bash
curl -X POST http://localhost:8000/api/officers/invite ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"officer@example.com\",\"name\":\"Officer Name\"}"
```

**Get Crime Predictions:**
```bash
curl http://localhost:8000/api/predictions/zones/1?date=2026-01-28
```

---

## 📡 API Endpoints

### Officers
- `POST /api/officers/invite` - Invite new officer
- `GET /api/officers` - List all officers
- `POST /api/officers/webhooks/clerk` - Clerk webhook handler

### Predictions
- `GET /api/predictions/zones/{zone_id}` - Get crime predictions for zone
- `GET /api/predictions/hotspots` - Get current hotspots
- `POST /api/predictions/patrol` - Generate optimal patrol route

### FIRs & Complaints
- `POST /api/firs` - File new FIR
- `GET /api/firs` - List all FIRs
- `POST /api/complaints` - Submit complaint
- `GET /api/complaints` - List complaints

### Patrols
- `POST /api/patrols` - Create patrol assignment
- `GET /api/patrols/active` - Get active patrols
- `PATCH /api/patrols/{id}/location` - Update officer location

### Zones & Hotspots
- `GET /api/zones` - List all city zones
- `GET /api/hotspots` - Get crime hotspots
- `GET /api/hotspots/map` - Hotspot visualization data

---

## 🛠️ Development Commands

**Reset Services:**
```bash
taskkill /F /IM python.exe
taskkill /F /IM prisma-query-engine-windows.exe
taskkill /F /IM ngrok.exe
```

**Quick Restart:**
```bash
hackEnv\Scripts\activate
python -m uvicorn app:app --reload
ngrok http 8000
```

**Database Reset:**
```bash
npx prisma migrate reset
npx prisma db push
```

---

## 📂 Project Structure

```
CityShield/
├── backend/
│   ├── app.py                    # FastAPI application
│   ├── routers/                  # API endpoints
│   │   ├── predictions.py        # ML predictions & patrol generation
│   │   ├── officers.py           # Officer management
│   │   ├── firs.py              # FIR handling
│   │   └── ...
│   ├── models/                   # Trained ML models
│   │   ├── xgboost_model.json
│   │   ├── lightgbm_model.txt
│   │   ├── catboost_model.cbm
│   │   └── model_metadata.json
│   ├── dataset/                  # Training data & scripts
│   │   └── training/
│   │       ├── prediction.py     # Inference utilities
│   │       └── EDA_crime_subtype.py
│   └── prisma/                   # Database schema
├── frontend/
│   ├── app/                      # Next.js pages
│   │   ├── admin/               # Admin dashboard
│   │   └── patrol/              # Officer interface
│   ├── components/              # React components
│   └── lib/                     # Utilities & API client
└── README.md
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Team

Built with ❤️ by the CityShield team for safer communities.

---

## 📞 Support

For issues, questions, or feature requests, please open an issue on GitHub.
