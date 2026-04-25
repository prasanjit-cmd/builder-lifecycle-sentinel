FROM node:22-bookworm-slim AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# Copy workspace
COPY . .

# Runtime
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "--loader", "tsx", "backend/index.ts"]
