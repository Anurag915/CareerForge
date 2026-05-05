# CareerForge: AI Resume Analyzer & Intelligence Platform

**CareerForge** is a production-grade, event-driven SaaS platform designed for high-scale resume analysis. It leverages Local LLMs, RAG (Retrieval-Augmented Generation), and a distributed task queue (Celery + Redis) to provide real-time, professional-grade career insights without blocking the user interface.

---

## 🚀 Key Features

### 👤 For Candidates & Recruiters
- **Real-Time Job Queue**: Monitor analysis progress live via WebSockets.
- **Asynchronous Analysis**: Upload dozens of resumes; the system processes them in the background while you continue working.
- **Professional Notifications**: Get notified instantly when a job completes, with a persistent unread badge and history.
- **Deterministic ATS Scoring**: A transparent, weighted scoring engine mirrors real-world recruitment logic.
- **AI Career Chat**: Interactive RAG-based chat to ask specific questions about your resume.

---

## 📸 Product Gallery

| | |
|:---:|:---:|
| ![Dashboard](Outputs/Screenshot%202026-05-05%20161711.png) | ![Analysis Queue](Outputs/Screenshot%202026-05-05%20161728.png) |
| ![Notifications](Outputs/Screenshot%202026-05-05%20161802.png) | ![Chat UI](Outputs/Screenshot%202026-05-05%20161928.png) |

---

## 🛠️ Tech Stack

### Backend (Distributed Engine)
- **API**: Python & Flask (REST + Socket.IO)
- **Task Queue**: Celery (Distributed Processing)
- **Message Broker**: Redis (High-speed Event Bus)
- **Server Engine**: Eventlet (High-concurrency support)
- **AI/ML**: Sentence-Transformers & FAISS (RAG)
- **LLM**: Ollama (Llama 3 / Phi-3)

### Frontend (Modern SaaS UI)
- **Core**: React & Vite
- **Real-time**: Socket.IO-Client
- **Styling**: Tailwind CSS & Framer Motion
- **Icons**: Lucide-React

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js & npm
- [Redis](https://redis.io/download/) (Must be running on `localhost:6379`)
- [Ollama](https://ollama.com/) (Running locally)

### 1. Setup & Installation
```bash
# Clone and navigate
cd server

# Install Python dependencies
pip install -r requirements.txt

# Setup Frontend
cd ../frontend
npm install
```

### 2. Running the Application (3 Terminals Required)

To run the full event-driven system, you must have three terminals open:

**Terminal 1: Redis Server**
```bash
redis-server
```

**Terminal 2: Flask API (Backend)**
```bash
cd server
python api.py
```

**Terminal 3: Celery Worker (AI Processor)**
```bash
cd server
# On Windows:
celery -A tasks worker --loglevel=info -P eventlet
# On Linux/Mac:
celery -A tasks worker --loglevel=info
```

**Terminal 4: React Frontend**
```bash
cd frontend
npm run dev
```

---

## 📁 Project Structure
```text
Resume Analyzer/
├── frontend/           # React App (SaaS UI)
├── server/             # Python Backend
│   ├── api.py          # Flask API & SocketIO
│   ├── tasks.py        # Celery Background Tasks
│   ├── celery_app.py   # Celery Configuration
│   ├── db.py           # SQLite handlers & Notifications
│   ├── rag.py          # Vector store & Retrieval
│   └── data/           # Persistent Storage
└── README.md
```

---

## 🛡️ Privacy & Performance
CareerForge uses a **Privacy-First** approach. All analysis is performed locally via Ollama. By utilizing Celery workers, the platform can handle concurrent high-volume analysis without crashing or slowing down the user experience.

---

**Built with ❤️ for a better career journey.**
