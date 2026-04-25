FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required by RDKit
RUN apt-get update && apt-get install -y \
    libxrender1 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-pip.txt /app/requirements-pip.txt
COPY main.py /app/main.py
COPY scientific_antibiotic_model.pkl /app/scientific_antibiotic_model.pkl

# Install all Python dependencies via pip (no conda needed)
RUN pip install --no-cache-dir \
    rdkit \
    pandas \
    scikit-learn \
    fastapi \
    uvicorn \
    python-multipart \
    -r requirements-pip.txt

# HF Spaces requires port 7860
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}"
