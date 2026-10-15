# ── build stage: compile native deps (better-sqlite3) for musl ──
FROM node:20-alpine AS build
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ── runtime stage ──
FROM node:20-alpine
RUN apk add --no-cache tini wget su-exec
RUN addgroup -S teos && adduser -S teos -G teos
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
COPY src/ ./src/
RUN mkdir -p /app/data && chown -R teos:teos /app
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/live || exit 1
# Railway mounts persistent volumes as root. Fix ownership of the data dir,
# then drop privileges to the unprivileged app user before starting Node.
ENTRYPOINT ["/sbin/tini", "--", "/bin/sh", "-c", "chown -R teos:teos /app/data 2>/dev/null || true; exec su-exec teos node src/server.js"]
