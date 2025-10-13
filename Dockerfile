FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="${PATH}:/root/.local/bin"

# Copy poetry configuration files
COPY pyproject.toml poetry.lock* ./

# Configure poetry to not use virtualenvs
RUN poetry config virtualenvs.create false

# Install dependencies
RUN poetry install --no-interaction --no-ansi --no-dev

# Copy application code
COPY src/ ./src/
COPY alembic/ ./alembic/
COPY alembic.ini ./

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=8000

# Expose the port
EXPOSE 8000

# Create entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Wait for database to be ready\n\
if [ -n "$POSTGRES_HOST" ]; then\n\
  echo "Waiting for PostgreSQL at $POSTGRES_HOST:$POSTGRES_PORT..."\n\
  while ! nc -z $POSTGRES_HOST $POSTGRES_PORT; do\n\
    sleep 0.5\n\
  done\n\
  echo "PostgreSQL is up and running!"\n\
fi\n\
\n\
# Run migrations\n\
if [ "$1" = "migrate" ]; then\n\
  echo "Running database migrations..."\n\
  alembic upgrade head\n\
  exit 0\n\
fi\n\
\n\
# Run the application\n\
if [ "$1" = "api" ]; then\n\
  echo "Starting API server..."\n\
  exec uvicorn src.api.main:app --host 0.0.0.0 --port $PORT\n\
fi\n\
\n\
# Default command\n\
exec "$@"\n\
' > /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]

# Default command
CMD ["api"]
