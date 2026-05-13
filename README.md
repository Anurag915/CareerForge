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
| **Dashboard Overview** | **Seamless Document Upload** |
| ![Dashboard](Outputs/Screenshot%202026-05-05%20161711.png) | ![Upload](Outputs/Screenshot%202026-05-05%20161728.png) |
| **Target Job Description** | **Deep Analysis Dashboard** |
| ![Job Description](Outputs/Screenshot%202026-05-05%20161802.png) | ![Analysis](Outputs/Screenshot%202026-05-05%20161928.png) |
| **ATS Match Report** | **Contextual AI Chat Assistant** |
| ![Analysis Metrics](Outputs/Screenshot%202026-05-05%20161948.png) | ![Chat UI](Outputs/Screenshot%202026-05-05%20162008.png) |
| **Multi-Resume A/B Comparison** | **Comparative Insights Engine** |
| ![Resume Comparison](Outputs/Screenshot%202026-05-05%20162253.png) | ![Result of Comparison](Outputs/Screenshot%202026-05-05%20162304.png) |
| **Active Job Queue** | **Persistent Search History** |
| ![Library of All Jobs](Outputs/Screenshot%202026-05-05%20162324.png) | ![History of All Jobs](Outputs/Screenshot%202026-05-05%20162335.png) | 

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

### 🚀 Running the Application

CareerForge features an **Intelligent Hybrid Architecture**. Choose the run configuration that best suits your developer preference:

---

#### 🧊 Option A: Standalone Mode (Recommended - 2 Terminals Only)
*Mimics the zero-cost cloud infrastructure (like Render Free Tier). Runs background processing inside native python daemon threads instead of requiring Redis/Celery pools.*

1.  Open [server/.env](file:///c:/Users/anurag.prajapati/Documents/Resume%20Analyzer/server/.env) and ensure `REDIS_URL` is **commented out** (e.g., `# REDIS_URL=...`).
2.  **Terminal 1: Flask API Server (Backend)**
    ```bash
    cd server
    # On Windows: .\venv\Scripts\activate  | On macOS/Linux: source venv/bin/activate
    python api.py
    ```
3.  **Terminal 2: React Web UI (Frontend)**
    ```bash
    cd frontend
    npm run dev
    ```

---

#### ⛅ Option B: Cloud SaaS Mode (3 Terminals)
*Leverages Cloud Redis (like Upstash) so you can test distributed Celery queues locally WITHOUT installing Redis on your computer.*

1.  Ensure `REDIS_URL` is active in [server/.env](file:///c:/Users/anurag.prajapati/Documents/Resume%20Analyzer/server/.env) pointing to your Upstash/Cloud Redis instance.
2.  **Terminal 1: Flask API Server (Backend)**
    ```bash
    cd server
    # On Windows: .\venv\Scripts\activate  | On macOS/Linux: source venv/bin/activate
    python api.py
    ```
3.  **Terminal 2: Celery Background Worker (AI Processor)**
    ```bash
    cd server
    # On Windows: .\venv\Scripts\activate  | On macOS/Linux: source venv/bin/activate
    celery -A celery_app worker --loglevel=info -P solo
    ```
4.  **Terminal 3: React Web UI (Frontend)**
    ```bash
    cd frontend
    npm run dev
    ```

---

#### 🏢 Option C: Full Local Cluster Mode (4 Terminals)
*Run a fully independent localized environment.*

1.  **Terminal 1: Local Redis Server**
    ```bash
    redis-server # (On WSL2/Linux: sudo service redis-server start)
    ```
2.  **Terminal 2: Flask API Server**
    ```bash
    cd server
    # Activate virtual environment...
    python api.py
    ```
3.  **Terminal 3: Celery Background Worker**
    ```bash
    cd server
    # Activate virtual environment...
    celery -A celery_app worker --loglevel=info -P solo
    ```
4.  **Terminal 4: React Web UI**
    ```bash
    cd frontend
    npm run dev
    ```

---

## 🐳 Docker Setup Guide (Recommended)

Run the entire CareerForge suite (Nginx, React, Flask, Celery, and Redis) with a single command. This configuration leverages your host machine's Ollama instance to utilize full GPU acceleration (Option A).

### 1. Prerequisites
- [Docker & Docker Compose](https://www.docker.com/products/docker-desktop/) installed and running.
- **Ollama** running locally on your host machine (with the `llama3` model pulled: `ollama pull llama3`).

### 2. Quick Start
From the project root directory, run:
```bash
# Build and launch all services in the background
docker-compose up -d --build
```

That's it! 
- Access the **React Web UI** at `http://localhost:80` (or simply `http://localhost`).
- The **Flask API** is exposed and accessible at `http://localhost:5000`.

### 3. Key Docker Configurations
- **Ollama GPU Acceleration**: The `docker-compose.yml` uses `host.docker.internal` to route LLM requests out of the container directly to your host machine's Ollama, utilizing your GPU for lightning-fast analysis.
- **Data Persistence**: Databases, indexed embeddings, and files are stored inside a persistent Docker volume (`backend_data`) so they remain intact even if you destroy or update containers.

### 4. Useful Commands
```bash
# View live logs from all services
docker-compose logs -f

# Stop and remove containers (preserving database volume)
docker-compose down

# Stop containers and wipe the database volume (clean reset)
docker-compose down -v
```

### 5. Running Instantly with Pre-Built Images (No Source Code Needed!)

For users who want to run the entire CareerForge suite instantly without downloading the source code or compiling anything locally, they can do so using pre-built Docker Hub images.

#### A. Prerequisites
1. Install [Docker & Docker Compose](https://www.docker.com/products/docker-desktop/) on your system.
2. Have [Ollama](https://ollama.com) running locally on your host machine with `llama3` downloaded:
   ```bash
   ollama pull llama3
   ```

#### B. Quick Start Steps
1. Create an empty folder on your computer.
2. Inside that folder, create a file named `docker-compose.yml` and paste the following content:

```yaml
version: '3.8'

services:
  # 1. Message Broker
  redis:
    image: redis:alpine
    container_name: careerforge-redis
    ports:
      - "6379:6379"
    restart: always

  # 2. Flask API Server
  backend:
    image: anuragprajapati123/careerforge-backend:latest
    container_name: careerforge-backend
    ports:
      - "5000:5000"
    environment:
      - REDIS_URL=redis://redis:6379/0
      - OLLAMA_HOST=http://host.docker.internal:11434
      - DEFAULT_MODEL=llama3
      - JWT_SECRET=careerforge-super-secret-key-2026
    volumes:
      - backend_data:/app/data
    extra_hosts:
      - "host.docker.internal:host-gateway"
    depends_on:
      - redis
    restart: always

  # 3. Background Worker
  celery:
    image: anuragprajapati123/careerforge-backend:latest
    container_name: careerforge-celery
    command: celery -A tasks worker --loglevel=info
    environment:
      - REDIS_URL=redis://redis:6379/0
      - OLLAMA_HOST=http://host.docker.internal:11434
      - DEFAULT_MODEL=llama3
    volumes:
      - backend_data:/app/data
    extra_hosts:
      - "host.docker.internal:host-gateway"
    depends_on:
      - redis
    restart: always

  # 4. React Frontend Web Server
  frontend:
    image: anuragprajapati123/careerforge-frontend:latest
    container_name: careerforge-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always

volumes:
  backend_data:
    driver: local
```

3. Open your terminal in that folder and run:
   ```bash
   docker-compose up -d
   ```
4. That's it! Access the web interface in your browser at: **`http://localhost`** (or `http://localhost:80`).

---

## ☁️ Cloud Production Deployment

CareerForge is fully architected for professional, serverless, and micro-tier cloud delivery, minimizing operational costs while maximizing real-time SaaS capabilities.

### 🏗️ Multi-Cloud Orchestration Framework

| Infrastructure Layer | Provider | Deployment Configuration Details |
| :--- | :--- | :--- |
| **Modern SaaS UI** | **Vercel** | Next-gen Edge hosting with custom dynamic fallback routing configured inside [vercel.json](file:///c:/Users/anurag.prajapati/Documents/Resume%20Analyzer/frontend/vercel.json) to support React SPA architectures. |
| **Real-Time Backend API** | **Render** | Containerized Docker deployment utilizing high-concurrency **Gevent** worker instances to maintain persistent socket tunnels and background RAG threads on a single node. |
| **Persistent Storage** | **Neon Tech** | Managed, serverless PostgreSQL cluster with native TLS/SSL encryption constraints. |
| **High-Speed Event Broker** | **Upstash** | Serverless Cloud Redis running over secure TLS (`rediss://`) for immediate cross-process event broadcasting. |

### 🧠 Production-Grade Cloud Intelligence Handled

To guarantee 100% operational stability across free/restricted cloud tier limits, our codebase natively implements three crucial engineering guardrails:

1.  **Auto-Adaptive Cloud Routing**: The API automatically reads the native platform flag `RENDER=true`. If found, it seamlessly shifts asynchronous processing from paid background Celery containers into **native, concurrent Python Daemon Threads** on the main web node—bypassing all credit card requirements and running entirely for free!
2.  **Self-Healing Vector Indexes**: Render’s local disks are ephemeral and wipe clean during daily server resets. Our Chat API intercepts missing `.index` files and **automatically regenerates the RAG FAISS vectors on-the-fly** from raw PostgreSQL text in `<0.1 seconds`, ensuring zero-maintenance stability!
3.  **Multi-Protocol TLS Translators**: Our backend dynamically splits and translates secure Redis URLs—satisfying Celery's requirement for uppercase `CERT_NONE` while satisfying SocketIO's requirement for lowercase `none`—eliminating conflicts between conflicting third-party libraries.

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
