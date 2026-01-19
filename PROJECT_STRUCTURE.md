# MedShare Project Structure

This document describes the organized folder structure of the MedShare project.

## Root Folders (6 Total)

### 1. `backend/`
Backend services including:
- LLMcore - Core AI/LLM functionality
- wood_wide_models - ML models for inventory prediction and anomaly detection
- Node.js backend services

### 2. `express_backend/`
Express.js backend server with:
- API routes (inventory, news, reports, settings)
- Supabase configuration
- Service layer (CSV processing, inventory management)
- Database utilities

### 3. `frontend/`
React/TypeScript frontend application with:
- Vite build configuration
- Component library
- Services (drug recognition, Gemini AI, LiveKit, voice alerts)
- Styling and assets

### 4. `docs/`
All project documentation including:
- Setup guides (QUICK_START_GUIDE.md, ENV_SETUP.md)
- Feature documentation (GEMINI_AI_INTEGRATION.md, LIVEKIT_INTEGRATION.md)
- Implementation notes and system status
- Test agents documentation (test-agents/)
- Deployment guides (VERCEL_DEPLOY.md)

### 5. `scripts/`
Utility scripts:
- `setup.sh` - Initial project setup
- `run-demo.sh` - Run demo environment
- `deploy-vercel.sh` - Vercel deployment script

### 6. `data/`
Data files:
- `daily_inventory.csv` - Inventory data
- `training_output.log` - ML training logs

## Root Files

- `README.md` - Main project README
- `package.json` / `package-lock.json` - Root package dependencies

## Quick Navigation

- **Start Here**: `docs/QUICK_START_GUIDE.md`
- **Setup Environment**: `docs/ENV_SETUP.md`
- **API Documentation**: `express_backend/README.md`
- **Frontend Guide**: `frontend/README.md`
- **Deploy**: `scripts/deploy-vercel.sh`
