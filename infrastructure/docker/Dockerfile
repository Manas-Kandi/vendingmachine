# Multi-stage Dockerfile for Zen Machine
FROM python:3.11-slim as base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir -e ".[dev]"

# Download models (placeholder - in production, use volume mounts)
RUN mkdir -p /app/models

# Production stage
FROM python:3.11-slim as production

# Create non-root user
RUN groupadd -r zen && useradd -r -g zen zen

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy installed packages from base stage
COPY --from=base /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=base /usr/local/bin /usr/local/bin

# Copy application code
COPY zen_machine/ ./zen_machine/
COPY ui/ ./ui/
COPY tests/ ./tests/

# Create directories for models and data
RUN mkdir -p /app/models /app/data /app/logs && \
    chown -R zen:zen /app

# Switch to non-root user
USER zen

# Expose ports
EXPOSE 8000 8001 6379

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command
CMD ["python", "-m", "zen_machine.cli", "serve"]
