FROM node:26-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate --config src/config/prisma/prisma.config.ts
RUN npm run build


FROM node:26-alpine AS runner

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/config ./src/config
COPY --from=builder /app/src/generated ./src/generated

RUN npm ci --omit=dev --ignore-scripts

CMD ["sh", "-c", "npm run prisma:migrate:deploy && npm run prod"]
