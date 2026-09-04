# Vention Lab Backend

Backend service built with NestJS, Prisma, PostgreSQL, RabbitMQ, and Redis.

---

## Tech Stack

- NestJS 11
- Prisma ORM
- PostgreSQL
- Redis (ioredis)
- RabbitMQ
- Swagger
- Jest (unit and e2e testing)
- Docker and Docker Compose

---

## Installation

```bash
npm install
```

---

## Environment Setup

The project uses environment-specific configuration files:

- `.env.development.local`
- `.env.production.local`

You have an example to work with:

- `.env.example`

### Development

```bash
cp .env.development.local .env
```

### Production

```bash
cp .env.production.local .env
```

---

## Prisma

### Generate Prisma client

```bash
npm run prisma:generate
```

### Run migrations (development)

```bash
npm run prisma:migrate:dev
```

### Deploy migrations (production)

```bash
npm run prisma:migrate:deploy
```

### Open Prisma Studio

```bash
npm run prisma:studio
```

### Reset database (development)

```bash
npm run prisma:reset
```

---

## Running the Application

### Development

```bash
npm run dev:main
```

### Production

```bash
npm run build
npm run start:main
```

---

## Testing

### Unit tests

```bash
npm run test
```

### Watch mode

```bash
npm run test:watch
```

### Coverage

```bash
npm run test:cov
```

### Debug tests

```bash
npm run test:debug
```

### End-to-end tests

```bash
npm run test:e2e
```

---

## Docker

### Build image

```bash
npm run docker:build
```

### Development environment

```bash
npm run docker:dev
```

Stop development environment:

```bash
npm run docker:dev:down
```

### Production environment

```bash
npm run docker:prod
```

Stop production environment:

```bash
npm run docker:prod:down
```

### File-process / RAG worker images

```bash
npm run docker:build:file-process
npm run docker:build:rag
```

---

## File processing pipeline

Flow:

- Excel: API upload → Firebase → RabbitMQ `file.process` → `file-process` (Excel parse) → RabbitMQ reply → API updates DB + WebSocket
- Markdown: API upload → Firebase → RabbitMQ `rag.process` → `rag` (parse → chunk → embed → Qdrant) → RabbitMQ reply → API updates DB + WebSocket
- Delete: API delete → RabbitMQ `rag.delete` → `rag` cleans Qdrant vectors by `fileId`

### Status lifecycle

`UPLOADED` → `PROCESSING` → `COMPLETED` | `FAILED`

Frontend may show a local `uploading` state while the HTTP upload is in flight; that is not a backend DB status.

### Run file-process locally

```bash
npm run docker:dev
cp credentials/firebase-service-account.json apps/file-process/credentials/
npm run dev:file-process
```

### Run RAG locally

```bash
cp credentials/firebase-service-account.json apps/rag/credentials/
npm run dev:rag
```

### Run workers via Docker

```bash
# put service account JSON in apps/file-process/credentials/ and apps/rag/credentials/
docker compose -f compose.dev.yml up -d --build file-process
docker compose -f compose.dev.yml up -d --build rag
```

### WebSocket (frontend)

- Namespace: `/files`
- Auth: `{ token, organizationId }`
- Event: `file.status` → `{ fileId, status, error }`

### Excel columns

`User email` | `Organization` | `Transaction size` | `Date` (`npm run excel:generate`)

---

## API Documentation

Rough Swagger to look at endpoints is available at:

```text
http://localhost:3000/api/docs
```

---

## Code Quality

### Format code

```bash
npm run format
```

### Lint code

```bash
npm run lint
```

---

## Project Structure

```text
apps/
  main/           # NestJS HTTP/GraphQL API + Prisma
  file-process/   # Excel processing worker
  rag/            # RAG / Qdrant worker
packages/
  shared/         # logger, rabbitmq, firebase, file-storage, qdrant
  contracts/      # file-process and rag message contracts
configs/          # shared TypeScript, Jest, Prettier
```

This is an npm workspaces monorepo. Shared infrastructure is consumed as workspace packages (`@vention/*`), not copied into services.

Root commands:

```bash
npm run dev:main
npm run dev:file-process
npm run dev:rag
npm run build
npm run build:main
npm run build:file-process
npm run build:rag
```

---

## Notes

- Prisma client must be generated after installation
- Environment variables must be configured before running the application
- Docker Compose includes full stack dependencies for local development
