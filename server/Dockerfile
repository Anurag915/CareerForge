# Use a slim Python 3.10 image as a base
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies needed for compiling python libraries (like FAISS)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# 1. Install CPU-only PyTorch first (This prevents the 3.5GB CUDA download!)
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# 2. Copy requirements.txt and install other Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend files
COPY . /app/

# Run the service without root privileges.
RUN useradd --create-home --uid 10001 careerforge \
    && mkdir -p /app/data/vector_store \
    && chown -R careerforge:careerforge /app

USER careerforge

# Expose the Flask port
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:5000/health/ready', timeout=3)" || exit 1

# Launch with Production-Grade Gunicorn scaled for Cloud Free Tiers (1 worker, Gevent, dynamic port)
CMD ["gunicorn", "--config", "gunicorn.conf.py", "api:app"]
