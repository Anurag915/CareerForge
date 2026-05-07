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

Choose your operating system below to set up all system dependencies (Python, Node.js, Redis, and Ollama) properly.

---

### 🪟 Windows Setup Guide

#### 1. System Dependencies Installation
*   **Python (3.9+)**: 
    *   Download and run the installer from the [Python Downloads](https://www.python.org/downloads/) page. **Crucial:** Ensure you check the box that says **"Add Python to PATH"** before starting the installation.
    *   *Alternative (via PowerShell):* `winget install Python.Python.3.11`
*   **Node.js (LTS)**:
    *   Download and run the installer from the [Node.js Official Website](https://nodejs.org/).
    *   *Alternative (via PowerShell):* `winget install OpenJS.NodeJS.LTS`
*   **Redis Server**: Redis does not natively run on Windows. Choose one of the options below:
    *   **Option A: WSL2 (Recommended)**: Install WSL with `wsl --install` in PowerShell, restart your PC, open your Ubuntu/Linux terminal, and run:
        ```bash
        sudo apt update
        sudo apt install redis-server -y
        sudo service redis-server start
        ```
    *   **Option B: Docker**: Install Docker Desktop and run:
        ```powershell
        docker run -d -p 6379:6379 --name redis redis
        ```
    *   **Option C: Memurai**: Download and install [Memurai](https://www.memurai.com/) (a native Windows Redis compatible developer build).
*   **Ollama (Local LLM)**:
    *   Download and install from [Ollama's Website](https://ollama.com/download/windows).
    *   Once Ollama is running in your system tray, open PowerShell and pull the model:
        ```powershell
        ollama pull llama3
        ```

#### 2. Project Setup & Installation
Open PowerShell in the project root directory and run:
```powershell
# Setup Backend Virtual Environment & Dependencies
cd server
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Setup Frontend Dependencies
cd ../frontend
npm install
```

---

### 🍎 macOS Setup Guide

#### 1. System Dependencies Installation
Using **Homebrew** is the easiest way to install and manage dependencies on macOS. If you don't have it, install it by running:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

*   **Python & Node.js**:
    ```bash
    brew install python node
    ```
*   **Redis Server**:
    ```bash
    brew install redis
    brew services start redis  # Starts Redis and registers it to run automatically on boot
    ```
*   **Ollama (Local LLM)**:
    ```bash
    brew install ollama
    # Or download the macOS App from https://ollama.com/download/mac
    ```
    After starting the Ollama app, open your terminal and pull the model:
    ```bash
    ollama pull llama3
    ```

#### 2. Project Setup & Installation
Open your terminal in the project root directory and run:
```bash
# Setup Backend Virtual Environment & Dependencies
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Setup Frontend Dependencies
cd ../frontend
npm install
```

---

### 🐧 Linux Setup Guide (Ubuntu/Debian)

#### 1. System Dependencies Installation
*   **Python, Pip & Virtual Environment**:
    ```bash
    sudo apt update
    sudo apt install python3 python3-pip python3-venv -y
    ```
*   **Node.js & npm**:
    ```bash
    sudo apt install nodejs npm -y
    ```
*   **Redis Server**:
    ```bash
    sudo apt install redis-server -y
    sudo systemctl enable --now redis-server
    ```
*   **Ollama (Local LLM)**:
    ```bash
    curl -fsSL https://ollama.com/install.sh | sh
    ollama pull llama3
    ```

#### 2. Project Setup & Installation
Open your terminal in the project root directory and run:
```bash
# Setup Backend Virtual Environment & Dependencies
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Setup Frontend Dependencies
cd ../frontend
npm install
```

---

### 🚀 Running the Application (4 Terminals Required)

To run the full event-driven system, you must have four terminals open:

**Terminal 1: Redis Server** (If not already running as a background service)
```bash
# Linux / macOS (if not started via brew services):
redis-server

# Windows WSL2 (if using Option A):
sudo service redis-server start
```

**Terminal 2: Flask API (Backend)**
```bash
cd server
# On Windows (PowerShell):
.\venv\Scripts\activate
# On Linux / macOS:
source venv/bin/activate

python api.py
```

**Terminal 3: Celery Worker (AI Processor)**
```bash
cd server
# On Windows (PowerShell):
.\venv\Scripts\activate
celery -A tasks worker --loglevel=info -P eventlet

# On Linux / macOS:
source venv/bin/activate
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
