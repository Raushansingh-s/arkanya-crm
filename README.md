# Arkanya Edutech Pvt. Ltd. ERP & CRM Platform

An enterprise-grade, multi-tenant SaaS Admission Consultancy platform featuring soft-glassmorphic design themes, integrated CRM pipeline stages, live seat matrix maps, accounting books, and automated AI assistance.

---

## 📂 Project Architecture

```
d:/New folder/
├── backend/                  # REST APIs (Node, Express, TS, Prisma, SQLite)
│   ├── src/
│   │   ├── controllers/      # Route actions (Auth, CRM, ERP, Accounting, AI)
│   │   ├── middleware/       # JWT token security & Role protection (RBAC)
│   │   ├── routes/           # REST routes mapped to `/api/*`
│   │   ├── utils/            # DB client singleton
│   │   └── index.ts          # Server entrypoint
│   └── prisma/
│       ├── schema.prisma     # DB Schema models (Multi-tenant)
│       └── seed.ts           # Realistic seed dataset
│
└── frontend/                 # Interactive Dashboard (React, TS, Tailwind, Framer Motion)
    ├── src/
    │   ├── App.tsx           # Central layout & sub-dashboards
    │   ├── index.css         # Glassmorphic themes & CSS animations
    │   └── main.tsx          # React render bootstrap
    ├── vite.config.ts        # Port 3000 mapping & proxy
    └── tailwind.config.js    # Color definitions and layout styles
```

---

## ⚡ Setup & Run Instructions

To boot up the application, open two separate terminal shells:

### 1. Start Backend API Server
```bash
cd backend
# Database migrations & seeding (Pre-configured SQLite dev.db)
npx prisma generate
npx prisma db push
npm run prisma:seed

# Launch Express server on http://localhost:5000
npm run dev
```

### 2. Start Frontend Dev Client
```bash
cd frontend
# Launch React dashboard on http://localhost:3000
npm run dev
```

---

## 🔑 Examiner Quick Login Credentials

During evaluation, you can switch between 10 different user roles. You can either use the **Quick Login Shortcuts** at the bottom of the sign-in screen, or manually input these credentials (Password: `password123`):

1. **Super Admin:** `admin@arkanya.in`
2. **Director (Finance):** `finance.director@arkanya.in`
3. **Director (Marketing):** `marketing.director@arkanya.in`
4. **Director (Legal):** `legal.director@arkanya.in`
5. **Counsellor:** `counsellor1@arkanya.in`
6. **Accountant:** `accountant@arkanya.in`
7. **Student:** `student@arkanya.in`

---

## 🌟 Advanced Features Implemented

1. **SaaS Multi-Tenancy**: Simulates workspace slug selection (`arkanya`), customized primary/accent color schemes, and domain routing.
2. **Lead CRM Kanban**: Visual pipeline stages with inline drag/stage transition updates and lead details overlay.
3. **Live Course Seat Matrix**: Color-coded seat matrices (Green ➔ Yellow ➔ Red) representing seat occupancy with interactive booking controls.
4. **Legal Agreements & Renewals**: Tracking validity periods of agreements, active commission terms, and renewal alert flags.
5. **AI Hub Integrations**:
   - **AI College Recommendations**: Matches student score and budget to college parameters.
   - **AI Admission Chance Predictor**: Analyzes cutoffs and seat occupancy ratio.
   - **AI OCR Document Scanner**: Simulates text parsing from Marksheets and Aadhar.
   - **AI Chatbot & Campaign Builder**: Generates bulk email/WhatsApp templates.
6. **Student Registry**: Interactive application tracker, document vault, provisional offer letter downloads, and digital ID card generator with dynamic QR Code.
