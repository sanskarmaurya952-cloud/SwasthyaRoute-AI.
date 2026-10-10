# SwasthyaRoute AI 🩺
> **Listen. Assess. Route. Follow Up.**  
> *Right Patient. Right Urgency. Right Care.*

[![Clinical CDS](https://img.shields.io/badge/Clinical_Protocol-NHM_%2F_MoHFW_CDS-087F8C.svg)](#clinical-safety--transparent-ai)
[![Offline-First](https://img.shields.io/badge/Architecture-Offline--First_IndexedDB-12304A.svg)](#offline-first-architecture)
[![FastAPI Backend](https://img.shields.io/badge/Backend-FastAPI_%2B_SQLite-009688.svg)](#backend-api)
[![Next.js Frontend](https://img.shields.io/badge/Frontend-Next.js_16_%2B_Tailwind_v4-000000.svg)](#frontend-features)
[![Tests Passing](https://img.shields.io/badge/Tests-6%2F6_Passed-emerald.svg)](#automated-testing)

---

## 1. Product Vision & Problem Statement

Frontline Accredited Social Health Activists (**ASHA workers**) and Auxiliary Nurse Midwives (**ANMs**) in rural and underserved Indian communities are the first line of defense in primary healthcare. However, frontline workers face severe bottlenecks:
1. **Unreliable Rural Connectivity**: Traditional cloud-dependent apps fail in interior villages with 2G/no cellular reception.
2. **Language & Data Entry Friction**: Typing complex clinical observations on mobile screens during patient home visits is slow and error-prone.
3. **Black-Box AI Risks**: Opaque generative models often hallucinate fabricated medical diagnoses or arbitrary probabilities (e.g. *"97% confidence"*), which violate clinical safety.
4. **Referral Drop-offs**: Lack of transparent status tracking between rural Sub-centres, Primary Health Centres (PHCs), Community Health Centres (CHCs), and District Hospitals causes preventable delays in emergency stabilization.

### The SwasthyaRoute AI Solution
**SwasthyaRoute AI** is an offline-first, voice-enabled, transparent clinical decision support (CDS) triage and smart referral routing system engineered specifically for ASHA worker workflows.

```
[ FRONT-LINE VOICE / SYMPTOMS / VITALS ]
                  │
                  ▼
   [ DETERMINISTIC RED-FLAG CDS ENGINE ]
   (SpO₂ < 90%, Tachypnea, Gestational BP, Shock Index)
                  │
                  ▼
    ┌───────────────────────────┐
    │  TRANSPARENT RISK TRIAGE   │
    │  • Emergency Immediate    │
    │  • Urgent Same-Day        │
    │  • Routine Scheduled      │
    └─────────────┬─────────────┘
                  │
                  ▼
   [ SMART FACILITY MATCHING & 108 AMBULANCE ESCALATION ]
   (District Hospital 24/7 ICU vs CHC Oxygen vs PHC)
                  │
                  ▼
      [ TWO-WAY OFFLINE SYNC QUEUE ]
      (IndexedDB ↔ FastAPI SQLite Server)
```

---

## 2. 90-Second Hackathon Judge Demo Walkthrough

Judges can complete the entire core clinical triage & referral workflow in under 90 seconds:

1. **Open Dashboard**: Go to `http://localhost:3000`. Observe live dynamic statistics derived from the local clinical database.
2. **Click &ldquo;Load Demo Scenario&rdquo;**: Top banner button loads the illustrative hackathon emergency case:
   - **Patient**: Rameshwar Sharma, Age 58
   - **Symptoms**: Breathlessness + High Fever
   - **Vitals**: SpO₂ **89.0%** *(Critical Hypoxemia)*, Heart Rate **112 bpm**, Temp **101.4°F**, RR **28 bpm**
   - **Hindi Voice Transcript**: *&ldquo;Patient ko saans lene mein dikkat hai aur fever hai.&rdquo;*
3. **Execute Clinical Assessment**: Observe the **High Risk (Emergency Immediate)** escalation:
   - Triggered red flag: `RF-SPO2-CRITICAL` (SpO₂ &lt; 90%)
   - Triggered syndrome: `RF-RESP-SPO2-SYNERGY` (Shortness of breath + low oxygen)
   - Transparent feature contributions breakdown (SpO₂: +50 pts, Breathlessness: +25 pts)
   - Recommended care level: **District Hospital (DH) / Emergency CHC with Continuous Oxygen**
4. **Create Referral**: Click &ldquo;Create Referral&rdquo;, assign destination facility to *District Hospital Civil Medical Center*, select *108 Emergency Ambulance (Dispatched)*, and confirm.
5. **Inspect Referral Center**: Navigate to **Referral Center** (`/referrals`), view the audit trail, and update status to *In Transit* or *Visit Completed*.
6. **Track Follow-up**: Navigate to **Follow-ups** (`/followups`), mark the post-referral home checkup completed.
7. **Test Offline Resilience**:
   - Go to **Settings & Offline** (`/settings`) or toggle **Simulate Offline: ON** in the header.
   - Run a new assessment completely offline in browser IndexedDB.
   - Observe the pending sync badge counter increment without data loss!

---

## 3. Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **Lucide Icons** |
| **Offline Persistence** | **Browser IndexedDB** (`SwasthyaRouteAI_OfflineDB`), **Web Storage API**, **PWA Manifest** |
| **Voice & Speech** | **Web Speech API** (`SpeechRecognition` & `SpeechSynthesis`) with `hi-IN` (Hindi) and `en-IN` fallbacks |
| **Backend API** | **Python 3.14 / FastAPI**, **Pydantic v2 validation**, **CORS Middleware**, **REST APIs** |
| **Database** | **SQLite 3** (`swasthya_route.db`) with structured JSON schema serialization |
| **Testing** | **Pytest**, **FastAPI TestClient**, **Next.js static typecheck** |

---

## 4. Design System & Clinical UI

Engineered according to strict healthcare usability standards:
- **Deep Navy (`#12304A`)**: Structural navigation, trustworthy clinical typography
- **Teal (`#087F8C`)**: Primary actionable clinical buttons and verified badges
- **Pale Blue (`#EAF4F8`)**: Calm background surfaces and secondary information tiles
- **Emergency Red (`#D64545`)**: Exclusively reserved for critical clinical red-flag states (e.g. SpO₂ &lt; 90%)
- **Amber (`#F2B544`)**: Cautionary indicators, moderate risk, and demo callouts
- **Slate (`#536779`)**: Secondary descriptive labels and metadata

---

## 5. Clinical Safety & Transparent Decision Support

> **Important Safety Principle**:  
> SwasthyaRoute AI is a prototype frontline clinical decision support (CDS) platform designed to assist ASHA workers in prioritizing urgency and routing patients according to standard MoHFW/NHM emergency guidelines. **It does not make autonomous medical diagnoses and does not replace qualified physicians.**

- **Zero Black-Box Hallucination**: Triage results are generated deterministically based on published emergency physiological thresholds.
- **Explainability**: Every assessment outputs a list of triggered rule IDs and feature weight contributions.
- **Missing Data Handling**: Unmeasured vitals are marked as *&ldquo;Not recorded&rdquo;* rather than silently assumed normal.

---

## 6. How to Run the Application Locally

### Prerequisites
- **Node.js**: v18+ (tested on v24)
- **Python**: 3.10+ (tested on Python 3.14)
- **npm** or **pnpm**

### Step 1: Install Backend Dependencies & Run Server
```bash
# In project root:
python -m pip install fastapi uvicorn pydantic pytest requests

# Start the FastAPI backend server:
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
*The API will be live at `http://localhost:8000` (Interactive Swagger docs at `http://localhost:8000/docs`).*

### Step 2: Install Frontend Dependencies & Start Next.js App
```bash
# In frontend directory:
cd frontend
npm install
npm run dev
```
*The frontend application will be live at `http://localhost:3000`.*

### Step 3: Run Automated Test Suite
```bash
# In project root:
python -m pytest backend/test_backend.py -v
```

---

## 7. Project Structure

```
swasthya-route-ai/
├── backend/
│   ├── database.py         # SQLite persistence & baseline demo seeding
│   ├── main.py             # FastAPI REST endpoints & CORS
│   ├── models.py           # Pydantic schemas (Patient, Assessment, Referral, Followup)
│   ├── triage_engine.py    # Deterministic NHM clinical rule engine
│   └── test_backend.py     # Pytest test suite (6/6 tests passing)
├── frontend/
│   ├── public/
│   │   ├── icon.svg        # PWA app icon
│   │   └── manifest.json   # Progressive Web App manifest
│   ├── src/
│   │   ├── app/
│   │   │   ├── assess/page.tsx     # 4-step Assess Patient workflow
│   │   │   ├── facilities/page.tsx # Health Facility directory
│   │   │   ├── followups/page.tsx  # ASHA Follow-up tracker
│   │   │   ├── layout.tsx          # Master layout with Header & Sidebar
│   │   │   ├── page.tsx            # Live dynamic Dashboard
│   │   │   ├── patients/page.tsx   # Searchable Patient records
│   │   │   ├── referrals/page.tsx  # Referral Center & audit trail
│   │   │   └── settings/page.tsx   # Offline simulation & Sync queue
│   │   ├── components/
│   │   │   ├── common/             # RiskBadge, UrgencyPill, SafetyBanner
│   │   │   └── layout/             # Header, Sidebar
│   │   ├── lib/
│   │   │   ├── api-client.ts       # Resilient API client with offline fallback
│   │   │   ├── offline-db.ts       # Browser IndexedDB persistence engine
│   │   │   ├── speech.ts           # Web Speech API & Hindi recognition
│   │   │   └── triage-rules.ts     # Client-side mirrored triage engine
│   │   └── types/index.ts          # Shared TypeScript interfaces
│   └── package.json
├── .env.example
└── README.md
```

---

## 8. Hackathon Verification Summary

- ✅ **Dashboard Navigation**: Fully working with dynamic counts linked to the database.
- ✅ **Patient Assessment**: 4-step wizard with Hindi speech recognition and text fallback.
- ✅ **Emergency Escalation**: Illustrative case (SpO₂ 89%, breathlessness, fever) triggers High Risk & Immediate Referral.
- ✅ **Referral Center**: Status updates, hospital selection, ambulance dispatch, and audit trail.
- ✅ **Follow-up Management**: Mark done, reschedule, and overdue filtering.
- ✅ **Offline Mode**: IndexedDB local persistence with two-way sync and simulated offline toggle.
- ✅ **Zero Paid API Dependencies**: Works 100% locally without external keys.
- ✅ **Test Coverage**: Pytest suite passing with 100% green status.
