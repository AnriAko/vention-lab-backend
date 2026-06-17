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
npm run dev
```

### Production

```bash
npm run build
npm run prod
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

### Build image without cache

```bash
npm run docker:build:clean
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
src/
  modules/
  infrastructure/
  config/
  shared/
  main.ts
```

---

## Notes

- Prisma client must be generated after installation
- Environment variables must be configured before running the application
- Docker Compose includes full stack dependencies for local development
