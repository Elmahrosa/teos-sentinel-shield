FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
COPY package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src/
COPY public ./public/ 2>/dev/null || true
COPY next.config.* ./

RUN npm run build

# ── Production runner ──
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

EOF ["npm", "start"]/app/public ./public 2>/dev/null || true

elomda@Elmahrosa-Teos MINGW64 ~/Documents/teos-sentinel-shield (main)
$ # STEP 4 — Rebuild dashboard only
docker-compose build --no-cache dashboard
[+] build 0/2
 - Image teos-sentinel-shield-core-engine Building                          0.6s
 - Image teos-sentinel-shield-dashboard   Building                          0.6s
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
; check if the path is correct and if the daemon is running: open //./pipe/docke
rDesktopLinuxEngine: The system cannot find the file specified.


elomda@Elmahrosa-Teos MINGW64 ~/Documents/teos-sentinel-shield (main)
$ # STEP 5 — Start everything
docker-compose up -d
unable to get image 'teos-sentinel-shield-core-engine': failed to connect to the
 docker API at npipe:////./pipe/dockerDesktopLinuxEngine; check if the path is c
orrect and if the daemon is running: open //./pipe/dockerDesktopLinuxEngine: The
 system cannot find the file specified.

elomda@Elmahrosa-Teos MINGW64 ~/Documents/teos-sentinel-shield (main)
$ # STEP 6 — Verify all 4 services are running
docker-compose ps
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
; check if the path is correct and if the daemon is running: open //./pipe/docke
rDesktopLinuxEngine: The system cannot find the file specified.

elomda@Elmahrosa-Teos MINGW64 ~/Documents/teos-sentinel-shield (main)
$ cat > dashboard/Dockerfile << 'EOF'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma/
RUN npm ci --omit=dev
RUN npx prisma generate
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public 2>/dev/null || true
EXPOSE 3000
CMD ["npm", "start"]
