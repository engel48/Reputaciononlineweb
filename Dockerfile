# Multi-stage Dockerfile for Next.js with better-sqlite3
FROM node:20-alpine AS base

# Install build dependencies for better-sqlite3
RUN apk add --no-cache libc6-compat python3 make g++

# Set working directory
WORKDIR /app

# Dependencies stage
FROM base AS deps
# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --production=false

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache libc6-compat

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create database directory
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Change ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]