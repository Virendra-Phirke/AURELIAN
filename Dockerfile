# ==========================================
# Multi-stage Dockerfile for Aurelian Platform
# ==========================================

# 1. Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build frontend & server bundle
COPY . .
RUN npm run build

# 2. Production runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built application assets and schema definitions
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/backend/db ./backend/db

EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
