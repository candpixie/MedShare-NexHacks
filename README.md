<<<<<<< HEAD
# MedShare

**Hospital Medication Network Platform**

> A decision platform that helps hospitals stop wasting expiring emergency & surgical meds and avoid shortages by flagging risk and matching excess↔need with nearby trusted partner hospitals.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/medshare)

---

## 🎯 Problem

- **$2.8B/year** in Medicare discarded drugs from single-use vials
- **20-50%** of prepared anesthesia drugs go unused and are discarded
- Drug shortages increased **4x** from 2006 to 2011
- Rural hospitals **"can't easily borrow from nearby hospitals"** (ASHP Guidelines)

## 💡 Solution

MedShare creates a trusted network where hospitals can:
1. **Flag** medications at risk of expiring unused
2. **Match** with nearby hospitals that need those medications
3. **Transfer** excess inventory before it becomes waste
4. **Track** savings and impact across the network

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works)
- Gemini API key
- ElevenLabs API key (optional, for voice alerts)

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/medshare.git
cd medshare

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Seed the database with demo data
npm run seed

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/medshare

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# ElevenLabs (optional)
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  MongoDB    │
│   (React)   │     │  (Next.js)  │     │   Atlas     │
│   Vercel    │     │   API       │     │             │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
          ┌─────▼─────┐       ┌─────▼─────┐
          │  Gemini   │       │ ElevenLabs│
          │  (AI)     │       │  (Voice)  │
          └───────────┘       └───────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes (Vercel Serverless) |
| Database | MongoDB Atlas |
| AI/ML | Google Gemini API |
| Voice | ElevenLabs API |
| Hosting | Vercel |

---

## 📁 Project Structure

```
medshare/
├── src/
│   ├── app/
│   │   ├── layout.jsx          # Root layout
│   │   ├── page.jsx            # Dashboard (main page)
│   │   └── api/
│   │       ├── hospitals/      # Hospital CRUD
│   │       ├── inventory/      # Inventory management
│   │       ├── matches/        # Matching algorithm
│   │       ├── transfers/      # Transfer proposals
│   │       ├── forecast/       # Gemini integration
│   │       └── voice-alert/    # ElevenLabs integration
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── StatsRow.jsx
│   │   ├── AlertCard.jsx
│   │   ├── MatchCard.jsx
│   │   ├── TransferModal.jsx
│   │   └── VoiceAlertButton.jsx
│   └── lib/
│       ├── mongodb.js          # Database connection
│       ├── seed-data.js        # Demo data
│       └── utils.js            # Helper functions
├── public/
├── .env.example
├── package.json
└── README.md
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/hospitals` | GET | List all hospitals in network |
| `/api/hospitals/:id` | GET | Get hospital details |
| `/api/inventory` | GET | Get inventory (filter: `?hospitalId`, `?expiring=true`) |
| `/api/inventory/:id` | PUT | Update inventory record |
| `/api/matches` | GET | Find matching hospitals (`?drugId`, `?qty`, `?maxDistance`) |
| `/api/transfers` | GET | List transfers (filter: `?hospitalId`, `?status`) |
| `/api/transfers` | POST | Create transfer proposal |
| `/api/transfers/:id` | PUT | Update transfer status |
| `/api/forecast` | POST | Get AI demand forecast |
| `/api/voice-alert` | POST | Generate voice alert audio |

---

## 🎮 Demo Data

The seed script creates:

**3 Hospitals:**
- Metro General Hospital (Downtown, urban)
- St. Mary's Medical Center (12 miles, suburban)
- County Medical Center (25 miles, rural)

**10 Medications:**
- Propofol 200mg/20mL (~$60/vial)
- Succinylcholine 20mg/mL (~$30/vial)
- Ephedrine 50mg/mL (~$25/vial)
- Lidocaine 2% (~$10/vial)
- Atropine 0.4mg/mL (~$20/vial)
- And more...

**Demo Scenarios:**
1. Propofol expiring at Metro → St. Mary's needs it ($1,620 savings)
2. Succinylcholine surplus at County → Metro needs it ($750 savings)
3. Shortage alert: St. Mary's low on critical medication
4. Atropine near-expiry with network match

---

## 🧠 Core Algorithm: Matching

```javascript
// Find hospitals that need medication you have excess of
async function findMatches(drugId, excessQty, fromHospitalId) {
  // 1. Get source hospital location
  // 2. Query inventory where (parLevel - quantity) > 0
  // 3. Calculate distances using Haversine formula
  // 4. Filter by max distance (default 50 miles)
  // 5. Sort by distance, return top 5
}
```

---

## 🤖 AI Integration (Gemini)

Used for demand forecasting:

```javascript
// Input: Historical usage, current stock, expiration
// Output: Predicted usage, risk level, recommendation

{
  "predictedUsage": 18,
  "riskLevel": "medium",
  "recommendation": "Transfer 27 excess vials to network partner",
  "confidence": 0.85
}
```

---

## 🔊 Voice Alerts (ElevenLabs)

Pre-generated alert templates:

> "Alert: 27 vials of Propofol 200mg expiring in 21 days. Match found: St. Mary's Hospital, 12 miles away. Propose transfer to save $1,620."

---

## 📊 Key Metrics

The dashboard tracks:
- **Total Savings** - Dollar value of waste prevented
- **Transfers Completed** - Number of successful transfers
- **Waste Avoided** - Vials saved from expiration
- **Network Partners** - Connected hospitals

---

## 🏆 Sponsor Integration

| Sponsor | Integration |
|---------|-------------|
| **Gemini API** | Demand forecasting, risk classification |
| **MongoDB Atlas** | All data storage |
| **ElevenLabs** | Voice alert generation |
| **Vercel** | Frontend + API hosting |

---

## 🛠️ Development

```bash
# Run development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build

# Seed database
npm run seed
```

---

## 📝 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run seed` | Seed database with demo data |
| `npm run lint` | Run ESLint |

---

## 🚢 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

```bash
# Or use Vercel CLI
npm i -g vercel
vercel
```

---

## 👥 Team

- **Person 1** - Backend Lead
- **Person 2** - Frontend + PM
- **Person 3** - Data + Scenarios
- **Person 4** - Demo Systems + QA

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- ASHP Guidelines on Drug Shortages
- Published research on anesthesia drug waste
- NexHacks 2026 organizers and sponsors

---

**Built with ❤️ at NexHacks 2026**
=======
# MedShare - Hospital Pharmacy Analytics Platform

A comprehensive pharmacy inventory management system with AI-powered analytics, expiration alerts, and FIFO compliance tracking.

## Project Structure

```
nex-hack-v1/
├── frontend/          # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── InventoryView.tsx
│   │   │   │   ├── ReportsView.tsx
│   │   │   │   ├── SettingsView.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── StatCard.tsx
│   │   │   │   └── ui/
│   │   │   └── App.tsx
│   │   └── styles/
│   └── package.json
│
└── backend/           # Node.js + Express + TypeScript backend
    ├── src/
    │   ├── routes/
    │   │   ├── inventory.ts
    │   │   ├── reports.ts
    │   │   └── settings.ts
    │   ├── data/
    │   │   └── mockData.ts
    │   ├── types/
    │   │   └── index.ts
    │   └── server.ts
    └── package.json
```

## Features

### Frontend
- 🎨 Modern glassmorphism UI with professional design
- 📊 Real-time dashboard with usage trends and analytics
- 📦 Full inventory management with search and filters
- 📄 PDF report generation and downloads
- ⚙️ User profile and hospital settings management
- 🌓 Dark mode support
- 📱 Responsive design

### Backend
- 🚀 RESTful API with Express
- 📊 Inventory management endpoints
- 📄 PDF report generation with PDFKit
- 👤 User profile and hospital settings
- 🔄 CORS enabled for local development

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. **Install Frontend Dependencies:**
```bash
cd frontend
npm install
```

2. **Install Backend Dependencies:**
```bash
cd backend
npm install
```

### Running the Application

1. **Start the Backend Server:**
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:3001`

2. **Start the Frontend Development Server:**
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

3. **Open your browser and navigate to:**
```
http://localhost:5173
```

## API Endpoints

### Inventory
- `GET /api/inventory` - Get all medications
- `GET /api/inventory/:id` - Get single medication
- `GET /api/inventory/stats/summary` - Get inventory statistics

### Reports
- `GET /api/reports` - Get available reports
- `GET /api/reports/download/:type` - Download PDF report

### Settings
- `GET /api/settings/profile` - Get user profile
- `PUT /api/settings/profile` - Update user profile
- `GET /api/settings/hospital` - Get hospital settings

## Report Types

1. **Inventory Report** - Complete medication list with quantities
2. **Expiration Alerts** - Medications expiring within 30 days
3. **FIFO Compliance** - First-in-first-out violation reports
4. **Forecast Report** - 30-day demand predictions
5. **Insights Report** - AI-powered recommendations

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Motion (Framer Motion)
- Recharts
- Shadcn/ui components

### Backend
- Node.js
- Express
- TypeScript
- PDFKit (PDF generation)
- CORS

## Development

### Frontend Development
```bash
cd frontend
npm run dev     # Start dev server
npm run build   # Build for production
npm run lint    # Run linter
```

### Backend Development
```bash
cd backend
npm run dev     # Start dev server with hot reload
npm run build   # Build TypeScript
npm start       # Run production build
```

## Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project was created for NexHacks 2026.

## Authors

Built with ❤️ for hospital pharmacy optimization
>>>>>>> 2026-01-17-ryvw
