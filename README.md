# CareerForge: AI Resume Analyzer & Intelligence Platform

**CareerForge** is a production-grade, multi-tenant SaaS platform designed to bridge the gap between candidates and recruiters using advanced AI. It leverages Local LLMs, RAG (Retrieval-Augmented Generation), and a deterministic weighted scoring engine to provide professional-grade resume analysis, optimization, and comparison.

---

## 🚀 Key Features

### 👤 For Candidates (Personal Career Optimization)
- **Resume Intelligence Analysis**: Deep-dive analysis of your resume against specific job descriptions.
- **Deterministic ATS Scoring**: A transparent, weighted scoring engine (60% Skills, 25% Experience, 15% Projects) that mirrors real-world ATS logic.
- **Find Best Resume (A/B Testing)**: Upload multiple versions of your resume to identify which one performs best for a target role.
- **AI Career Chat**: Interactive RAG-based chat to ask specific questions about your resume's strengths and weaknesses.
- **My Resume Vault**: Persistent, secure storage for all your professional documents.

### 💼 For Hiring Managers (Recruitment Intelligence)
- **Candidate Comparison Dashboard**: Side-by-side comparison of multiple candidates against a single JD.
- **Quick Batch Processing**: Upload dozens of resumes at once for instant ranking without cluttering the database.
- **Shortlist Filtering**: Deterministic ranking to quickly identify the Top N candidates based on technical match.
- **AI Synthesis**: AI-generated summaries and comparison insights for high-volume screening.

### 🛡️ Platform & Security
- **Multi-Tenant Isolation**: Strict user-based data isolation ensuring you only ever see your own documents and analysis.
- **Role-Based Access Control (RBAC)**: Distinct interfaces and restricted features for Candidates vs. Hiring Managers.
- **Local AI Privacy**: Designed to run with local LLMs (Ollama) to ensure data privacy and security.

---

## 🛠️ Tech Stack

### Backend (The Intelligence Engine)
- **Core**: Python & Flask (REST API)
- **Database**: SQLite (Relational Data)
- **Vector Engine**: FAISS (High-performance RAG)
- **AI/ML**: Sentence-Transformers (`all-MiniLM-L6-v2`) for embeddings
- **LLM**: Ollama (Llama 3 / Phi-3) for local reasoning and analysis
- **Security**: JWT (Authentication) & Bcrypt (Password Hashing)

### Frontend (The SaaS UI)
- **Core**: React & Vite
- **Styling**: Tailwind CSS (Modern, Responsive Design)
- **Animations**: Framer Motion (Smooth UI Transitions)
- **Icons**: Lucide-React
- **State Management**: React Context API (Auth & Session)

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js & npm
- [Ollama](https://ollama.com/) (Running locally)

### 1. Backend Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
pip install flask flask-cors sqlite3 sentence-transformers faiss-cpu requests pyjwt bcrypt pdfplumber

# Ensure Ollama is running and Llama3 is pulled
ollama pull llama3

# Start the server
python api.py
```
*The server will run on `http://localhost:5000`*

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
*The UI will be available at `http://localhost:5173`*

---

## 📁 Project Structure
```text
Resume Analyzer/
├── frontend/           # React App (SaaS UI)
├── server/             # Python Backend (Intelligence Engine)
│   ├── api.py          # Main Flask API
│   ├── db.py           # SQLite handlers & Schema
│   ├── rag.py          # Vector store & Retrieval
│   ├── llm.py          # AI Logic & Prompts
│   ├── utils.py        # ATS Scoring & Parsers
│   └── data/           # Local Database & Indices
└── README.md
```

---

## 🛡️ Privacy Note
CareerForge is built with a **Privacy-First** approach. By using local embeddings and LLMs via Ollama, your sensitive professional data remains on your machine or private server, never leaving your controlled environment for AI training.

---

**Built with ❤️ for a better career journey.**
