# ==========================================
# Stage 1: Build Frontend (React + Vite)
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Runtime (FastAPI Backend + Nginx Frontend)
# ==========================================
FROM python:3.12-slim AS runner

# Install nginx, curl, and process tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx curl procps && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python backend dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend application source
COPY backend ./backend

# Copy built frontend static files to Nginx web root
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy Nginx configuration listening on port 8097
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script, strip any Windows CRLF endings, make executable
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

# Environment configuration
ENV PYTHONUNBUFFERED=1 \
    PORT=5098 \
    HOST=127.0.0.1

# Expose the frontend port (8097)
EXPOSE 8097

ENTRYPOINT ["/docker-entrypoint.sh"]
