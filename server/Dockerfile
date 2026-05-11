# Use a slim Python 3.10 image as a base
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

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

# Expose the Flask port
EXPOSE 5000

# Default command (used for the Flask API container)
CMD ["python", "api.py"]
