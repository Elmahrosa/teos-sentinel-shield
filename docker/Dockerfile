FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache curl tini

COPY --from=build /app/node_modules ./node_modules
COPY ws-server/ ./ws-server/
COPY server/ ./server/
COPY public/ ./public/
COPY cli/ ./cli/
COPY package*.json ./

ENV NODE_ENV=production
ENV PORT=8080
ENV TEOS_MODE=production

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -sf http://localhost:8080/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "ws-server/index.js"]
