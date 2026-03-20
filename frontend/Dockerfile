# frontend/Dockerfile
# Multi-stage build: Node build → Nginx serve

# ─── Stage 1: Build ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --silent

# Copy source and build
COPY . .
RUN npm run build

# ─── Stage 2: Serve with Nginx ────────────────────────────────
FROM nginx:alpine AS production

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config is mounted via docker-compose volume
# (deploy/nginx/nginx.conf → /etc/nginx/conf.d/default.conf)

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
