# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev)
RUN npm ci --legacy-peer-deps

# Copy all application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production environment
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy build artifacts from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Install production dependencies only
RUN npm ci --production --legacy-peer-deps && npm cache clean --force

EXPOSE 3000

CMD ["npm", "start"]
