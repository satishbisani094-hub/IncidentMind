# IncidentMind 🧠⚡

> **Autonomous AI Incident Response Agent with Hindsight Persistent Memory**

![IncidentMind Banner](https://img.shields.io/badge/IncidentMind-AI%20Agent-6366F1?style=for-the-badge&logo=probot&logoColor=white)
![Hindsight Memory](https://img.shields.io/badge/Memory-Hindsight-10B981?style=for-the-badge&logo=postgresql&logoColor=white)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20Vite%20%7C%20Tailwind-06B6D4?style=for-the-badge)

IncidentMind is a production-quality AI Incident Response Agent designed for engineering and DevOps workflows. Unlike traditional stateless AI assistants that give generic troubleshooting steps, IncidentMind retains a persistent memory of past production outages, root causes, troubleshooting steps, and verified resolutions using **Vectorize Hindsight Engine**. When a new incident occurs, IncidentMind recalls matching historical memories and recommends verified resolutions to drastically reduce Mean Time to Resolution (MTTR).

---

## 1. Problem Statement

When production outages occur, Site Reliability Engineers (SREs) and DevOps engineers waste critical minutes searching through scattered systems:
- Past Slack outage channels & PagerDuty alerts
- Historical post-mortems and Jira root-cause documents
- Service runbooks and deployment release notes
- Error log aggregators (Datadog, Grafana)

A standard, stateless AI chatbot does not remember previous incidents or resolutions. Each time an outage occurs, a stateless assistant starts from scratch, recommending generic steps like *"Check your server logs and restart the instance."*

---

## 2. Solution: Persistent Agent Memory via Hindsight

IncidentMind solves this by utilizing **Hindsight** to store and recall structured incident memories:
- **RETAIN**: When an engineer resolves an incident, IncidentMind captures the exact error trace, deployment version, root cause, and successful fix into persistent memory.
- **RECALL**: When a new incident is submitted, IncidentMind queries Hindsight using multi-strategy hybrid retrieval (vector semantic similarity + keyword BM25 + temporal filtering).
- **LEARN**: As more incidents are resolved, IncidentMind becomes smarter, automatically connecting similar symptoms across releases and microservices.

---

## 3. Why Persistent Memory Matters

| Feature | Stateless AI Chatbot | IncidentMind (with Hindsight) |
| :--- | :--- | :--- |
| **Historical Memory** | None (resets every session) | Persistent across releases, services, and months |
| **Recommendation Basis** | Generic training data | Real production resolution outcomes from your team |
| **Root Cause Recall** | Guesses generic causes | Cites specific historical root causes (e.g. pool exhaustion) |
| **Accuracy** | Variable | High confidence backed by past verified outcomes |
| **MTTR Impact** | Low | High (Up to 40% reduction in resolution time) |

---

## 4. Key Features

- **Engineering Ops Dashboard**: Real-time incident counters, MTTR metrics, affected microservices index, and Hindsight Memory bank stats.
- **AI Incident Analysis Engine**: Automated diagnosis powered by LLM function calling and Hindsight memory recall.
- **Interactive Before/After Learning Demo**: Dedicated visual walkthrough (`/learning-demo`) demonstrating stateless AI vs. Hindsight memory-enhanced AI.
- **Memory Explorer**: Live visualizer (`/memory`) showcasing stored memory banks, root causes, and verified resolution strategies.
- **Historical Incidents Catalog**: Searchable and filterable database (`/incidents`) of 20+ realistic production incidents.
- **Zero-Config Resilient Setup**: Dual-mode memory provider (Online Hindsight Cloud API + Local vector hybrid fallback).

---

## 5. Architecture

![Architecture Diagram](./docs/architecture.svg)

```
User / Engineer
     │
     ▼
React UI (Vite + Tailwind CSS)
     │
     ▼ (REST API)
Express.js Backend (Node.js / TypeScript)
     │
     ├──► AI Agent Engine (Gemini / OpenAI LLM + Tool Calling)
     │
     ├──► Hindsight Memory Engine (@vectorize-io/hindsight-client)
     │       ├── RETAIN: Stores Root Causes & Resolutions
     │       └── RECALL: Retrieves Past Incident Experiences
     │
     └──► Database Repository (PostgreSQL / SQLite)
```

---

## 6. Hindsight Integration Details

IncidentMind integrates directly with Vectorize Hindsight memory architecture.

### Hindsight Core Operations
1. **RETAIN (`memoryService.retainIncident`)**:
   Called when an engineer resolves an incident. Stores structured memory:
   - Microservice name & deployment tag
   - Error trace & symptoms
   - Verified root cause
   - Step-by-step resolution & outcome status (`SUCCESS`)

2. **RECALL (`memoryService.recallMemories`)**:
   Executed before generating diagnostic recommendations. Performs parallel multi-strategy search over the Hindsight Bank (`incidentmind-production`):
   - **Semantic Vector Similarity**: Matches semantic context of symptoms and logs.
   - **Metadata Filtering**: Filters or boosts relevance by microservice name and error signature.

3. **REFLECT**:
   Synthesizes observations across accumulated incident records to update service health profiles.

---

## 7. Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, React Router DOM
- **Backend**: Node.js, Express.js, TypeScript, SQLite / PostgreSQL
- **AI / LLM**: Google Gemini API (`@google/generative-ai`) / OpenAI API with function calling
- **Memory Engine**: Hindsight Memory Engine (`@vectorize-io/hindsight-client` + Local vector engine fallback)

---

## 8. Environment Variables

Create a `.env` file in the root directory (or copy from `.env.example`):

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Hindsight Memory Engine
HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=hs_demo_key_incidentmind
HINDSIGHT_BANK_ID=incidentmind-production

# AI / LLM Keys
GEMINI_API_KEY=your_gemini_api_key_here
LLM_PROVIDER=gemini

# Database
DATABASE_URL=file:./incidentmind.db
```

---

## 9. Quick Start & Local Execution

### Prerequisites
- Node.js v18+ & npm

### Installation & Startup

1. **Clone Repository**:
   ```bash
   git clone https://github.com/your-username/IncidentMind.git
   cd IncidentMind
   ```

2. **Install Dependencies**:
   ```bash
   npm run setup
   ```

3. **Seed Database & Hindsight Memory Bank**:
   ```bash
   npm run seed
   ```

4. **Run Application**:
   ```bash
   npm run dev
   ```

5. Open browser at `http://localhost:3000`. Backend runs at `http://localhost:5000`.

---

## 10. Primary Demonstration Story (Before/After Scenario)

To experience the power of persistent memory, navigate to `/learning-demo` or follow these steps:

### STEP 1: First Incident (No Memory)
1. Go to **Report Incident** (`/create-incident`).
2. Click **Preset: Payment API 503**.
3. Submit the incident.
4. The AI agent analyzes the incident. Because no prior memory exists for this exact scenario, it reports:
   > *"No sufficiently similar historical incident was found in Hindsight Memory Bank. Generating general initial diagnostic plan."*

### STEP 2: Resolve & Retain
1. Click **Resolve & Retain in Hindsight**.
2. Enter Confirmed Root Cause: `Database connection pool exhaustion`.
3. Enter Resolution: `Increased database connection pool size from 10 to 50 in deployment config and restarted service.`
4. Submit resolution. Hindsight retains this experience into its memory bank.

### STEP 3: Second Incident (With Hindsight Recall)
1. Go to **Report Incident** (`/create-incident`) again.
2. Submit a similar incident: *"Payment API is again returning HTTP 503 errors after release v2.5.1"*.
3. The AI agent executes Hindsight RECALL and responds with:
   > *"I found a previous incident with similar symptoms involving Payment API. The previous root cause was database connection pool exhaustion. The successful resolution was increasing the connection pool size and restarting the service."*

---

## 11. API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Returns real-time incident metrics & memory statistics |
| `GET` | `/api/incidents` | List historical incidents with filters (`service`, `severity`, `search`) |
| `POST` | `/api/incidents` | Create a new incident entry |
| `GET` | `/api/incidents/:id` | Get incident details and latest AI analysis |
| `POST` | `/api/incidents/:id/analyze` | Trigger AI agent diagnostic loop & Hindsight recall |
| `POST` | `/api/incidents/:id/resolve` | Save resolution and trigger Hindsight `retain` operation |
| `GET` | `/api/memories` | Browse all active memories stored in Hindsight Bank |
| `POST` | `/api/memories/recall` | Search raw memory bank via query |
| `POST` | `/api/demo/seed` | Reset and populate 20+ realistic engineering incident records |

---

## 12. License & Author

- Built for production incident workflows powered by Vectorize Hindsight Engine.
