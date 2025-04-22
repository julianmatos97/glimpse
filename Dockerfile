FROM python:3.13-slim

WORKDIR /app

# Install system dependencies including PostgreSQL client
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install uv for faster package installation
RUN pip install --no-cache-dir uv

# Copy pyproject.toml first for better layer caching
COPY pyproject.toml .

# Copy application code
COPY . .

# Create virtual environment and install dependencies
# Explicitly specify the Python interpreter
RUN uv venv --python $(which python3) .venv
ENV PATH="/app/.venv/bin:$PATH"
RUN . .venv/bin/activate && uv pip install --no-cache-dir -e .

# Create non-root user for security
RUN adduser --disabled-password --gecos "" appuser
RUN chown -R appuser:appuser /app
USER appuser

# Set Python path
ENV PYTHONPATH=/app

# Port exposure is handled by docker-compose
EXPOSE 8000

# Command is specified in docker-compose.yaml
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0"]