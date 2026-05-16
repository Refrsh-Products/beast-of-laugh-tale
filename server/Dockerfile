# syntax=docker/dockerfile:1.7

# ---- Stage 1: builder ----
# Compiles wheels, installs all Python deps into an isolated venv.
FROM python:3.13-slim AS builder

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Install CPU-only torch / torchvision first. The CUDA wheels are multi-GB and
# we don't have a GPU on the VPS. Subsequent `pip install -r requirements.txt`
# sees torch is already satisfied at the pinned version and skips it.
RUN pip install --no-cache-dir \
    --index-url https://download.pytorch.org/whl/cpu \
    torch==2.10.0 torchvision==0.25.0

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Swap opencv-python (GUI build, needs libGL) for opencv-python-headless.
# unstructured_inference declares opencv-python as a dep, so we can't just
# rename it in requirements.txt — pip pulls it in transitively.
RUN pip uninstall -y opencv-python && \
    pip install --no-cache-dir opencv-python-headless==4.13.0.92

# ---- Stage 2: runtime ----
# Carries only the venv + runtime system libs, none of the build toolchain.
FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH"

# libmagic1: python-magic
# poppler-utils: pdf2image
# tesseract-ocr: unstructured.pytesseract
# psycopg-binary bundles libpq, so libpq5 is not needed.
# libgl1 is dropped — opencv-python-headless does not need it.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmagic1 \
    poppler-utils \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv

WORKDIR /app
COPY . .

EXPOSE 8000
