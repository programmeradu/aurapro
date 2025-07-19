---
description: Repository Information Overview
alwaysApply: true
---

# Repository Information Overview

## Repository Summary
AURA is an AI-powered transport optimization system for Ghana, consisting of a main web application, a backend API service, and a mobile commuter app. The project aims to transform Ghana's informal transport system with intelligent routing, real-time tracking, and data-driven insights.

## Repository Structure
- **src/**: Next.js frontend components, pages, and services
- **backend/**: FastAPI backend with ML models and API endpoints
- **mobile-app/**: Progressive Web App for commuters
- **gtfs-*/**: GTFS (General Transit Feed Specification) data for Ghana's transport network
- **assets/**: Icons and visual resources
- **scripts/**: Utility scripts for deployment and optimization
- **security/**: Security configurations and middleware

## Main Repository Components
- **Command Center**: Enterprise dashboard for transport management (Next.js)
- **Backend API**: FastAPI service with ML models and data processing
- **Mobile Commuter App**: PWA for commuters to track and plan journeys
- **GTFS Data**: Transport network data for Accra, Ghana

## Projects

### Command Center (Web Dashboard)
**Configuration File**: package.json

#### Language & Runtime
**Language**: TypeScript/JavaScript
**Version**: TypeScript 5.5.0
**Build System**: Next.js 15.0.0
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- next 15.0.0
- react 18.3.0
- mapbox-gl 3.13.0
- zustand 4.5.0
- @nextui-org/react 2.6.11
- @tanstack/react-query 5.51.0

#### Build & Installation
```bash
npm install
npm run build
npm run start
```

#### Testing
**Framework**: Jest (implied from ESLint config)
**Test Files**: test-*.js files in root directory
**Run Command**:
```bash
npm run test
```

### Backend API
**Configuration File**: backend/requirements.txt

#### Language & Runtime
**Language**: Python
**Version**: Python 3.9
**Framework**: FastAPI 0.104.1
**Package Manager**: pip

#### Dependencies
**Main Dependencies**:
- fastapi 0.104.1
- uvicorn 0.24.0
- pandas 2.1.3
- numpy 1.25.2
- scikit-learn 1.3.2
- sqlalchemy 2.0.23
- python-jose 3.3.0
- ortools 9.7.2996+

#### Build & Installation
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8002
```

#### Docker
**Dockerfile**: backend/Dockerfile
**Image**: Python 3.9-slim
**Configuration**: Exposes port 8002, runs uvicorn server

#### Testing
**Framework**: pytest 7.4.3
**Test Location**: backend/tests/
**Run Command**:
```bash
cd backend
pytest
```

### Mobile Commuter App
**Configuration File**: mobile-app/package.json

#### Language & Runtime
**Language**: TypeScript
**Version**: TypeScript 5.0.0+
**Framework**: Next.js 14.0.3
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- next 14.0.3
- react 18.2.0
- mapbox-gl 2.15.0
- framer-motion 10.0.0
- tailwindcss 3.3.0

#### Build & Installation
```bash
cd mobile-app
npm install
npm run build
npm run start -p 3001
```

### Streamlit Frontend
**Configuration File**: requirements.txt

#### Language & Runtime
**Language**: Python
**Version**: Python 3.9+
**Framework**: Streamlit 1.35.0
**Package Manager**: pip

#### Dependencies
**Main Dependencies**:
- streamlit 1.35.0
- folium 0.14.0
- plotly 5.15.0
- pydeck 0.8.1b0
- pandas 2.2.3+

#### Build & Installation
```bash
pip install -r requirements.txt
streamlit run app.py --server.port 8503
```

### GTFS Data Repository
**Type**: Data files

#### Specification & Tools
**Format**: GTFS (General Transit Feed Specification)
**Files**: agency.txt, stops.txt, routes.txt, trips.txt, stop_times.txt, etc.
**Versions**: 2016 data (gtfs-accra-ghana-2016) and 2025 projections (gtfs-ghana-2025)

#### Key Resources
**Main Files**:
- stops.txt: Transit stop locations
- routes.txt: Transit route definitions
- trips.txt: Schedule information
- shapes.txt: Route shapes for mapping

## Docker Configuration
**Main Dockerfile**: Dockerfile (Node.js 18-alpine for frontend)
**Backend Dockerfile**: backend/Dockerfile (Python 3.9-slim)
**Compose File**: docker-compose.yml
**Services**:
- frontend: Exposes port 3000
- backend: Exposes port 8002