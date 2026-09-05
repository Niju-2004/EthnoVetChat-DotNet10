# 🌿 EthnoVet Chat

[![.NET 10](https://img.shields.io/badge/.NET-10.0-512BD4?style=flat&logo=dotnet)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon.tech-336791?style=flat&logo=postgresql)](https://neon.tech/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini_RAG-4285F4?style=flat&logo=google)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com/)

> **பாரம்பரிய மூலிகை கால்நடை மருத்துவ வழிகாட்டி**  
> An ultra-responsive, clinically safe, bilingual (English & தமிழ்) AI assistant for **Traditional Ethnoveterinary Practices (EVP)** powered by **.NET 10**, **Google Gemini AI**, **Server-Sent Events (SSE) Streaming**, **Neon.tech PostgreSQL**, and **React + Vite + TailwindCSS**.

---

## 📑 Table of Contents
1. [Overview & Core Mission](#-overview--core-mission)
2. [Key Features](#-key-features)
3. [Architecture Overview](#-architecture-overview)
4. [Technology Stack](#-technology-stack)
5. [Database Schema (Neon.tech PostgreSQL)](#-database-schema-neontech-postgresql)
6. [API Endpoints Reference](#-api-endpoints-reference)
7. [Project Structure](#-project-structure)
8. [Local Development Setup](#-local-development-setup)
9. [Cloud Deployment (Plan B: Vercel + Render + Neon)](#-cloud-deployment-plan-b-vercel--render--neon)
10. [Clinical Safety & Veterinary Principles](#-clinical-safety--veterinary-principles)

---

## 🌟 Overview & Core Mission

Smallholder farmers and rural livestock owners frequently lack immediate access to registered veterinary clinics for common ailments (e.g., bloat, diarrhea, minor wounds, mastitis, milk drop). 

**EthnoVet Chat** bridges this gap by offering verified, cost-effective herbal first-aid treatments rooted in traditional ethnoveterinary knowledge compendiums while actively enforcing clinical safety constraints (e.g., species-specific toxicity warnings for dogs and cats, acute emergency escalations).

---

## ✨ Key Features

### 1. ⚡ Sub-15ms Fast-Path Triage Engine
- Non-medical user intents (greetings like *"Hi"*, *"Hello"*, and animal declarations like *"I have a cow"*) are intercepted instantly in **< 15 ms** without remote LLM roundtrips, eliminating unnecessary API quota usage and lag.

### 2. 🧠 Precomputed PDF Vector Embeddings (Zero-Lag RAG)
- 51 granular remedies across 22 veterinary conditions pre-extracted from traditional veterinary compendiums (`data-ethnovet.pdf`).
- 768-dimensional normalized embeddings pre-computed via `gemini-embedding-001` and bundled as a lightweight index (`ethnovet_embeddings.json`, ~825 KB).
- Heavy PDF files are excluded from Git and cloud containers to ensure **instant container startup** on Render.

### 3. 🌊 Real-Time SSE Token Streaming
- Token-by-token real-time streaming via Server-Sent Events (`POST /api/chat/stream`).
- Returns metadata events (`meta`) containing detected animals and accordion remedy cards, followed by real-time token chunks (`token`), and a final termination signal (`done`).

### 4. 🔒 Mandatory Farmer Authentication & 3-Stage Wizard
- **No Anonymous Consultations**: Chat consultations require an authenticated farmer account to preserve records and prevent unauthorized quota drainage.
- **3-Stage Transactional Registration Wizard**:
  - **Stage 1 (Identity)**: Username, email, password (with show/hide eye toggle and confirmation).
  - **Stage 2 (Language)**: Preferred language selection (**English** or **தமிழ்**).
  - **Stage 3 (Review)**: Summary confirmation and single-click account creation.
- Secure password hashing using **PBKDF2 with HMAC-SHA256** (100,000 iterations, 16-byte cryptographically secure salt) and 30-day JWT tokens.
- Language preference is changeable at any time in the top navigation bar and automatically synchronized with the database (`PUT /api/auth/language`).

### 5. 🗄️ Neon.tech Serverless PostgreSQL Persistence
- Full long-term storage of farmer profiles, multi-turn consultations, every message turn, and lifetime disease query demand aggregations.
- Seamless driver parsing: automatically converts Neon pooled URI connection strings (`postgresql://...`) into native Npgsql parameters with SSL mode required.
- Graceful in-memory fallback for offline/local development without database configuration.

### 6. 🕒 Consultation History Drawer
- Authenticated farmers can open the slide-out history drawer to browse past veterinary consultations, review previous herbal prescriptions, resume conversations, or delete past sessions with database-cascading cleanup.

### 7. 🛡️ Enterprise Admin Portal
- Protected with constant-time passcode comparison, brute-force IP rate-limiting (5 attempts = 10-minute lockout), and HMAC-signed session tokens.
- **Farmer Consultation Audit Monitor**: Live inspection of farmer conversations with farmer username (`@farmer`), email, species filters, and real-time safety badges (*Emergency Alert*, *Dog Safety Check*, *Standard Triage*).
- **Remedy Knowledge Base (CRUD)**: Add, edit, delete, and search verified ethnoveterinary recipes.
- **Analytics & Trends**: Real-time KPI cards (Total Remedies, Registered Farmers, Consultations, Messages Logged, API Health), livestock ailment demand heatmaps, and species distributions.
- **AI Hyperparameter Inspector**: Inspect active model target (`gemini-3.1-flash-lite`), temperature (`0.2`), and max token limits.

### 8. 🎨 Modern User Experience
- **Dark Mode**: Complete class-based dark palette with instant toggle and local storage memory.
- **Voice Input**: Speech-to-text input via the Web Speech API supporting both Indian English (`en-IN`) and Tamil (`ta-IN`).
- **Species Quick Chips**: One-click animal targeting (`Cow / Cattle`, `Goat / Sheep`, `Poultry`, `Dog`).
- **Custom Favicon Branding**: Herbal veterinary emblem replacing default framework icons.

---

## 🏗️ Architecture Overview

```
+-----------------------------------------------------------------------------------------+
|                        Ethnovet.UI (React 19 + TypeScript + Vite)                       |
|                                                                                         |
|  [ Header / Lang Toggle ]  [ AnimalSelector ]  [ Streaming Bubble ]  [ Auth Barrier ]   |
|  [ 3-Stage Register ]      [ Login Modal ]     [ History Drawer ]    [ Admin Console ]  |
+--------------------------------------------|--------------------------------------------+
                                             | HTTPS / SSE (POST /api/chat/stream)
                                             v
+-----------------------------------------------------------------------------------------+
|                           EthnovetChat.ServiceLayer (.NET 10)                           |
|                                                                                         |
|  [ ChatController ]       [ AuthController ]      [ AdminController ]                   |
|       |                         |                       |                               |
|       v                         v                       v                               |
|  [ ChatService ]          [ UserAuthService ]     [ AdminAuthService ]                  |
|       ├── Fast-Path Triage     (PBKDF2 + JWT)         (HMAC-SHA256 Lockout)             |
|       ├── RAG Search                                                                    |
|       └── Gemini SSE Stream                                                             |
+-------------------|-------------------------------------|-------------------------------+
                    v                                     v
+------------------------------------+   +------------------------------------------------+
|    EthnovetChat.DataAccessLayer    |   |           Remote Cloud Infrastructure          |
|                                    |   |                                                |
|  [ EthnovetDbContext (EF Core) ]  |-->|  Neon.tech PostgreSQL (Pooled Serverless DB)    |
|  [ EthnovetRepository ]            |   |  - users, chat_sessions, chat_messages         |
|  [ ethnovet_embeddings.json ]      |   |                                                |
|  (51 Precomputed EVP Vectors)      |   |  Google Gemini API (v1beta)                    |
+------------------------------------+   |  - gemini-3.1-flash-lite (SSE Generation)      |
                                         +------------------------------------------------+
```

---

## 💻 Technology Stack

### Backend (.NET 10 Web API)
- **Runtime**: .NET 10.0 SDK & ASP.NET Core
- **ORM**: Entity Framework Core 10 (`Npgsql.EntityFrameworkCore.PostgreSQL`, `Microsoft.EntityFrameworkCore.InMemory`)
- **Authentication**: JWT Bearer (`Microsoft.AspNetCore.Authentication.JwtBearer`), PBKDF2/HMAC-SHA256
- **AI Integration**: Google Gemini API (`gemini-3.1-flash-lite`, `gemini-embedding-001`) via typed HTTP client with SSE
- **Documentation**: OpenAPI / Swagger UI & Scalar API Reference
- **Containerization**: Official Microsoft .NET 10 Alpine multi-stage `Dockerfile`

### Frontend (SPA)
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) with `@custom-variant dark`
- **Icons**: Lucide React
- **Voice Recognition**: Web Speech API (`SpeechRecognition`)

### Cloud Infrastructure
- **Frontend Hosting**: Vercel (Global Edge CDN, SPA fallback rewrites)
- **Backend Hosting**: Render (Docker Web Service with dynamic `$PORT` binding)
- **Database**: Neon.tech (Serverless PostgreSQL with connection pooling)

---

## 🗄️ Database Schema (Neon.tech PostgreSQL)

The schema is defined in `schema_neon.sql`:

```sql
-- 1. Users Table (Farmers & Administrators)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'Farmer',
    preferred_language VARCHAR(5) NOT NULL DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Chat Sessions Table (Long-Term Farmer Consultations)
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL DEFAULT 'New Consultation',
    persisted_animal VARCHAR(50),
    persisted_language VARCHAR(5) NOT NULL DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Chat Messages Table (Every Multi-Turn Message Turn)
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    relevant_remedies_json JSONB,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Disease Analytics Table (Lifetime Demand Tracking)
CREATE TABLE disease_analytics (
    id SERIAL PRIMARY KEY,
    disease_name VARCHAR(100) NOT NULL UNIQUE,
    query_count INT NOT NULL DEFAULT 1,
    last_queried_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔌 API Endpoints Reference

### 1. Farmer Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | 3-stage farmer account creation | Public |
| `POST` | `/api/auth/login` | Authenticate farmer & issue 30-day JWT | Public |
| `GET` | `/api/auth/me` | Fetch active user profile from JWT | `Bearer <JWT>` |
| `PUT` | `/api/auth/language` | Update preferred language (`en`/`ta`) | `Bearer <JWT>` |

### 2. Veterinary Chat & Consultations (`/api/chat`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/chat` | Blocking JSON consultation response | `Bearer <JWT>` |
| `POST` | `/api/chat/stream` | Server-Sent Events (SSE) token stream | `Bearer <JWT>` |
| `GET` | `/api/chat/user-sessions` | List all historical consultations for farmer | `Bearer <JWT>` |
| `GET` | `/api/chat/user-sessions/{id}` | Load past consultation transcript | `Bearer <JWT>` |
| `DELETE`| `/api/chat/user-sessions/{id}`| Delete a saved consultation from cloud | `Bearer <JWT>` |
| `DELETE`| `/api/chat/sessions/{id}` | Clear active in-memory session | Public |
| `GET` | `/api/chat/health` | Service health status | Public |

### 3. Admin Console (`/api/admin`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/login` | Admin login (rate-limited, brute-force lockout)| Master Passcode |
| `GET` | `/api/admin/verify` | Verify admin token validity | `X-Admin-Token` |
| `GET` | `/api/admin/analytics` | High-level metrics & disease demand heatmap | `X-Admin-Token` |
| `GET` | `/api/admin/chats` | Farmer-attributed consultation audits | `X-Admin-Token` |
| `GET` | `/api/admin/remedies` | Complete remedy repository | `X-Admin-Token` |
| `POST` | `/api/admin/remedies` | Create new traditional remedy | `X-Admin-Token` |
| `PUT` | `/api/admin/remedies/{id}`| Update existing remedy | `X-Admin-Token` |
| `DELETE`| `/api/admin/remedies/{id}`| Remove remedy | `X-Admin-Token` |
| `GET` | `/api/admin/ai-config` | View active Gemini hyperparameters | `X-Admin-Token` |

---

## 📁 Project Structure

```
EthnoVetChatSolution/
├── Ethnovet.UI/                         # React 19 + TypeScript + Vite Frontend
│   ├── public/
│   │   └── favicon.svg                  # Herbal veterinary emblem
│   ├── src/
│   │   ├── components/
│   │   │   ├── Admin/                   # Admin Portal (Monitor, Analytics, CRUD, Config)
│   │   │   ├── Auth/                    # RegisterWizard (3-Stage) & LoginModal
│   │   │   ├── AnimalSelector.tsx       # Target species selection pill bar
│   │   │   ├── ChatHistoryDrawer.tsx    # Slide-out cloud consultation browser
│   │   │   ├── ChatInput.tsx            # Voice recognition & suggestion input
│   │   │   ├── Header.tsx               # Branding, AI RAG badge, Theme, User badge
│   │   │   ├── MessageItem.tsx          # Structured bubbles & safety alerts
│   │   │   └── RemedyCard.tsx           # Accordion traditional recipe card
│   │   ├── App.tsx                      # Root coordinator & login barrier gate
│   │   └── types.ts                     # TypeScript data interfaces
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json                      # SPA fallback rewrites for Vercel
│
├── EthnovetChat.DataAccessLayer/        # Data Layer & Database Models
│   ├── Data/
│   │   ├── EthnovetDbContext.cs         # EF Core DbContext for PostgreSQL
│   │   ├── ethnovet_embeddings.json     # 51 precomputed 768-dim EVP vectors
│   │   └── generate_embeddings.mjs      # Offline vector extraction script
│   ├── Models/                          # User, PersistentSession, Message, Remedy
│   └── Repositories/                    # Thread-safe EVP remedy repository
│
├── EthnovetChat.ServiceLayer/           # ASP.NET Core 10 Web API
│   ├── Controllers/                     # ChatController, AuthController, AdminController
│   ├── DTOs/                            # Data transfer objects
│   ├── Services/                        # ChatService, GeminiService, UserAuthService
│   ├── Program.cs                       # App entrypoint, Neon URI parser, DI setup
│   ├── appsettings.json                 # Production configuration
│   └── appsettings.Development.json     # Local development overrides (gitignored)
│
├── Dockerfile                           # Multi-stage .NET 10 container for Render
├── schema_neon.sql                      # Complete PostgreSQL schema for Neon.tech
├── .gitignore                           # Excludes secrets, PDFs, and build artifacts
└── README.md
```

---

## 🚀 Local Development Setup

### Prerequisites
- [.NET 10.0 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js](https://nodejs.org/) (v18 or higher)
- Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))
- (Optional) Neon.tech PostgreSQL connection string

### 1. Clone the Repository
```bash
git clone https://github.com/Niju-2004/EthnoVetChat-DotNet10.git
cd EthnoVetChatSolution
```

### 2. Configure Backend Secrets
In `EthnovetChat.ServiceLayer/appsettings.Development.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "NeonPostgres": "postgresql://username:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
  },
  "Gemini": {
    "ApiKey": "YOUR_GOOGLE_GEMINI_API_KEY",
    "Model": "gemini-3.1-flash-lite"
  }
}
```
*(Note: If `NeonPostgres` is omitted, the app will automatically use an in-memory database for local testing.)*

### 3. Run Backend (.NET 10 API)
```bash
dotnet run --project EthnovetChat.ServiceLayer
```
- API will start at `http://localhost:5000` (or `https://localhost:5001`).
- Swagger documentation available at: `http://localhost:5000/swagger`.

### 4. Run Frontend (React + Vite)
In a separate terminal:
```bash
cd Ethnovet.UI
cmd /c npm install
cmd /c npm run dev
```
- Open your browser at `http://localhost:5173`.

---

## ☁️ Cloud Deployment (Plan B: Vercel + Render + Neon)

### 1. Database (Neon.tech - 100% Free)
1. Sign up at [neon.tech](https://neon.tech) and create a project (e.g. `ethnovet-db`).
2. Open the **SQL Editor** and execute the script in `schema_neon.sql`.
3. Copy your pooled connection string:
   `postgresql://neondb_owner:password@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`

### 2. Backend (Render - 100% Free)
1. Sign up at [dashboard.render.com](https://dashboard.render.com) and click **New + $\rightarrow$ Web Service**.
2. Connect your GitHub repository `EthnoVetChat-DotNet10`.
3. Set **Runtime**: `Docker`, **Branch**: `master`, **Instance Type**: `Free`.
4. Add Environment Variables:
   - `Gemini__ApiKey` = *(Your Gemini API key)*
   - `ConnectionStrings__NeonPostgres` = *(Your Neon PostgreSQL connection string)*
   - `ADMIN_PASSWORD` = *(Your chosen admin master passcode)*
   - `ASPNETCORE_ENVIRONMENT` = `Production`
5. Deploy service and copy your public backend URL (e.g. `https://ethnovet-api.onrender.com`).

### 3. Frontend (Vercel - 100% Free)
1. Sign up at [vercel.com](https://vercel.com) and click **Add New... $\rightarrow$ Project**.
2. Import `EthnoVetChat-DotNet10`.
3. Set **Root Directory** to `Ethnovet.UI` and **Framework Preset** to `Vite`.
4. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://ethnovet-api.onrender.com` (no trailing slash)
5. Click **Deploy**. Vercel will provide your production URL (e.g. `https://ethnovet-ui.vercel.app`).

---

## 🐾 Clinical Safety & Veterinary Principles

1. **Ruminant vs. Monogastric Safety (Canine Guard)**:
   Traditional ethnoveterinary remedies formulated for cattle (rumen microbes) can be toxic or fatal to dogs and cats (e.g., concentrated camphor, large allium doses). The AI actively intercepts canine queries, cautions the farmer, and restricts prescriptions to species-appropriate care.
2. **Emergency Escalation Alerts**:
   Acute symptoms (profuse bleeding, bloat with respiratory distress, suspected poisoning, bone fractures) immediately display an emergency alert advising direct clinical intervention by a registered veterinarian.
3. **Transparent Herbal Ingredients**:
   All remedies include botanical names, preparation instructions, dosage measurements, and administration frequencies in farmer-friendly language.
4. **Supportive First-Aid Stance**:
   Ethnoveterinary medicine is positioned as supportive first-aid and prevention—not a replacement for emergency surgical or clinical veterinary hospital procedures.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).  
Traditional remedy formulations are compiled for educational and rural veterinary first-aid guidance.