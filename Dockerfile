# TEOS Sentinel Shield backend — single container (API + WebSocket + static).
# Works on Render (Docker), Koyeb, Fly.io, or any Node host.
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000
# ws-server/index.js reads PORT from the environment and binds 0.0.0.0.
CMD ["npm", "start"]
