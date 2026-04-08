FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/
RUN npm install

COPY tsconfig.json ./
COPY src ./src/
RUN npm run prisma:generate
RUN npm run build

# ─── Production image ─────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev
RUN npm run prisma:generate

COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["npm", "run", "start"]
