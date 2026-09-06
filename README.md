# Vention Lab Backend

Backend monorepo built with NestJS, Prisma, PostgreSQL, RabbitMQ, Redis, Qdrant, and Ollama.

The project uses **npm workspaces** and follows a service-oriented architecture:

- `main` — HTTP/GraphQL API and application orchestration
- `file-process` — file processing microservice
- `rag` — RAG processing microservice
- `packages` — shared infrastructure and message contracts

---

## Tech Stack

- NestJS 11
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis (`ioredis`)
- RabbitMQ
- Qdrant
- Ollama
- Firebase Storage
- Swagger
- Socket.IO
- Jest
- Docker
- Docker Compose
- npm Workspaces

---

## Project Structure

```text
apps/
├── main/               # HTTP/GraphQL API + Prisma
├── file-process/       # File processing microservice
└── rag/                # RAG / Qdrant microservice

packages/
├── shared/
│   ├── logger/
│   ├── rabbitmq/
│   ├── firebase/
│   ├── file-storage/
│   └── qdrant/
│
└── contracts/
    ├── file-process/
    ├── generation/
    └── rag/

configs/
└── shared configuration

scripts/
├── workspace-utils.js
├── build-packages.js
└── generate-dockerfile.js
```

This is an **npm workspaces monorepo**.

Shared infrastructure is consumed through workspace packages such as:

```text
@vention/shared-logger
@vention/shared-rabbitmq
@vention/shared-firebase
@vention/shared-file-storage
@vention/shared-qdrant
```

Message contracts are also workspace packages:

```text
@vention/file-process-contract
@vention/generation-contract
@vention/rag-contract
```

---

## Installation

```bash
npm install
```

---

## Environment Setup

The project uses environment-specific configuration files:

```text
.env.example
.env.development.local
.env.production.local
```

### Development

```bash
cp .env.development.local .env
```

### Production

```bash
cp .env.production.local .env
```

Make sure all required environment variables are configured before starting the services.

---

# Development

## Main service

Run the main API in development mode:

```bash
npm run dev:main
```

## File processing service

```bash
npm run dev:file-process
```

## RAG service

```bash
npm run dev:rag
```

---

# Build

The project has a dependency-aware workspace build system.

## Build all shared packages

```bash
npm run build:packages
```

The script automatically:

1. Reads workspaces from the root `package.json`
2. Finds workspace packages
3. Detects internal `@vention/*` dependencies
4. Resolves dependency order
5. Builds packages sequentially

For example, if package A depends on package B, B is built first.

---

## Build a specific package

```bash
npm run build:package -- @vention/shared-logger
```

The script also builds the package's internal workspace dependencies first.

---

## Build dependencies of a workspace

```bash
npm run build:dependencies --workspace=@vention/rag
```

This builds only the internal workspace dependencies required by the specified workspace.

---

## Build individual applications

```bash
npm run build:main

npm run build:file-process

npm run build:rag
```

## Build everything

```bash
npm run build
```

This performs:

```text
build:packages
    ↓
build:main
    ↓
build:file-process
    ↓
build:rag
```

---

# Prisma

Prisma is used by the `main` service.

## Generate Prisma Client

```bash
npm run prisma:generate
```

## Create development migration

```bash
npm run prisma:migrate:create
```

## Run development migrations

```bash
npm run prisma:migrate:dev
```

## Deploy migrations

```bash
npm run prisma:migrate:deploy
```

## Seed database

```bash
npm run prisma:seed
```

## Clean database

```bash
npm run prisma:clean
```

## Fresh database seed

```bash
npm run prisma:seed:fresh
```

## Push Prisma schema

```bash
npm run prisma:push
```

## Reset database

```bash
npm run prisma:reset
```

## Prisma Studio

```bash
npm run prisma:studio
```

---

# Docker

Docker images are generated dynamically from the npm workspace configuration.

The Docker generator automatically discovers all workspace packages and copies their `package.json` files before running `npm ci`.

This means that when a new workspace package is added, the Docker build does not require manually adding another `COPY package.json` instruction.

---

## Dockerfile generation

Generate a Dockerfile for `main`:

```bash
npm run docker:generate:main
```

Generate a Dockerfile for `file-process`:

```bash
npm run docker:generate:file-process
```

Generate a Dockerfile for `rag`:

```bash
npm run docker:generate:rag
```

The generator creates:

```text
Dockerfile.main.generated
Dockerfile.file-process.generated
Dockerfile.rag.generated
```

These files are generated artifacts and should not be edited manually.

---

## Build application images

### Main API

```bash
npm run docker:build
```

Generates the `main` Dockerfile and builds:

```text
vention-api
```

### File processing service

```bash
npm run docker:build:file-process
```

Builds:

```text
vention-file-process
```

### RAG service

```bash
npm run docker:build:rag
```

Builds:

```text
vention-rag
```

---

## Docker build architecture

The generated Dockerfiles use multiple stages:

```text
dependencies
      │
      │ npm ci
      ▼
build
      │
      │ npm run build:<service>
      ▼
production
      │
      │ compiled application
      ▼
Docker image
```

The dependency stage copies only:

```text
package.json
package-lock.json
workspace package.json files
configs/
```

before running:

```bash
npm ci
```

This allows Docker to reuse the dependency layer when application source code changes without changing dependencies.

---

# Docker Compose

## Development environment

Start the development infrastructure:

```bash
npm run docker:dev
```

## Development tools

Start services with the tools profile:

```bash
npm run docker:dev:tools
```

## Antivirus services

```bash
npm run docker:dev:av
```

## Full development environment

```bash
npm run docker:dev:all
```

## Stop development environment

```bash
npm run docker:dev:down
```

---

## Production environment

Start the production environment:

```bash
npm run docker:prod
```

Stop the production environment:

```bash
npm run docker:prod:down
```

---

# File Processing Pipeline

The backend uses RabbitMQ to communicate between the main service and processing microservices.

## Excel

```text
API upload
    ↓
Firebase Storage
    ↓
RabbitMQ: file.process
    ↓
file-process
    ↓
Excel parsing
    ↓
RabbitMQ reply
    ↓
main
    ↓
Database update
    ↓
WebSocket notification
```

## Markdown / RAG

```text
API upload
    ↓
Firebase Storage
    ↓
RabbitMQ: rag.process
    ↓
rag
    ↓
Parse
    ↓
Chunk
    ↓
Generate embeddings
    ↓
Qdrant
    ↓
RabbitMQ reply
    ↓
main
    ↓
Database update
    ↓
WebSocket notification
```

## File deletion

```text
API delete
    ↓
RabbitMQ: rag.delete
    ↓
rag
    ↓
Delete Qdrant vectors by fileId
```

---

# File Status Lifecycle

Files use the following backend status lifecycle:

```text
UPLOADED
    ↓
PROCESSING
    ↓
COMPLETED
```

or:

```text
PROCESSING
    ↓
FAILED
```

The frontend may use a local `uploading` state while the HTTP upload is in progress.

`uploading` is **not** a backend database status.

---

# File Processing Services

## Run file-process locally

Start the infrastructure first:

```bash
npm run docker:dev
```

Then configure the Firebase service account:

```text
apps/file-process/credentials/
```

Start the worker:

```bash
npm run dev:file-process
```

---

## Run RAG locally

Configure the Firebase service account:

```text
apps/rag/credentials/
```

Start the RAG worker:

```bash
npm run dev:rag
```

The RAG service uses:

- Firebase Storage
- RabbitMQ
- Qdrant
- Ollama
- embedding models

---

## Run workers with Docker Compose

Place the Firebase service account files in the appropriate credentials directories.

Then:

```bash
docker compose -f compose.dev.yml up -d --build file-process
```

```bash
docker compose -f compose.dev.yml up -d --build rag
```

---

# RAG

The RAG pipeline is responsible for transforming uploaded documents into searchable vectors.

```text
Document
   ↓
Parser
   ↓
Chunks
   ↓
Embedding model
   ↓
Vector
   ↓
Qdrant
```

The RAG service currently supports document processing through the configured parsing and chunking pipeline.

Qdrant stores vectors together with metadata such as organization and document/file identifiers, allowing searches to be scoped to the appropriate tenant.

---

# WebSocket

The main service exposes the file processing status through WebSocket.

### Namespace

```text
/files
```

### Authentication

```text
{
    token,
    organizationId
}
```

### Event

```text
file.status
```

Payload:

```json
{
    "fileId": "string",
    "status": "UPLOADED | PROCESSING | COMPLETED | FAILED",
    "error": "string | null"
}
```

---

# Excel Generator

Generate an Excel file with the expected columns:

```bash
npm run excel:generate
```

Columns:

```text
User email
Organization
Transaction size
Date
```

---

# Testing

## Run all available tests

```bash
npm run test
```

## Main service tests

```bash
npm run test:main
```

## File-process tests

```bash
npm run test:file-process
```

## RAG tests

```bash
npm run test:rag
```

## Watch mode

```bash
npm run test:watch
```

## Coverage

```bash
npm run test:cov
```

## End-to-end tests

```bash
npm run test:e2e
```

---

# API Documentation

Swagger documentation is available when the main service is running:

```text
http://localhost:3000/api/docs
```

---

# Code Quality

## Format

```bash
npm run format
```

## Lint

```bash
npm run lint
```

The project uses ESLint and Prettier with shared configuration from `configs/`.

---

# Available Root Commands

### Development

```bash
npm run dev:main
npm run dev:file-process
npm run dev:rag
```

### Build

```bash
npm run build
npm run build:packages
npm run build:package
npm run build:dependencies

npm run build:main
npm run build:file-process
npm run build:rag
```

### Docker

```bash
npm run docker:generate:main
npm run docker:generate:file-process
npm run docker:generate:rag

npm run docker:build
npm run docker:build:file-process
npm run docker:build:rag

npm run docker:dev
npm run docker:dev:tools
npm run docker:dev:av
npm run docker:dev:all
npm run docker:dev:down

npm run docker:prod
npm run docker:prod:down
```

### Database

```bash
npm run prisma:generate
npm run prisma:migrate:create
npm run prisma:migrate:dev
npm run prisma:migrate:deploy
npm run prisma:seed
npm run prisma:clean
npm run prisma:seed:fresh
npm run prisma:studio
npm run prisma:reset
npm run prisma:push
```

### Testing

```bash
npm run test
npm run test:main
npm run test:file-process
npm run test:rag
npm run test:watch
npm run test:cov
npm run test:e2e
```

### Code quality

```bash
npm run lint
npm run format
```

---

# Architecture Overview

```text
                         ┌─────────────────┐
                         │     Client      │
                         └────────┬────────┘
                                  │
                          HTTP / GraphQL
                                  │
                                  ▼
                         ┌─────────────────┐
                         │      main       │
                         │ API / Prisma    │
                         └───────┬─────────┘
                                 │
                          RabbitMQ messages
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
           ┌─────────────────┐       ┌─────────────────┐
           │  file-process   │       │       rag       │
           │                 │       │                 │
           │ Excel parsing   │       │ Parse / Chunk   │
           │                 │       │ Embeddings      │
           └─────────────────┘       └────────┬────────┘
                                              │
                                              ▼
                                        ┌───────────┐
                                        │  Qdrant   │
                                        └───────────┘
```

Shared infrastructure is extracted into reusable workspace packages:

```text
@vention/shared-logger
@vention/shared-rabbitmq
@vention/shared-firebase
@vention/shared-file-storage
@vention/shared-qdrant
```

Communication contracts are separated from implementations:

```text
@vention/file-process-contract
@vention/generation-contract
@vention/rag-contract
```

This keeps the microservices independent while providing shared infrastructure and strongly typed communication contracts.

---

# Notes

- Run `npm install` after cloning the repository.
- Generate the Prisma client before using database functionality.
- Environment variables must be configured before starting services.
- RabbitMQ must be available for microservice communication.
- Qdrant must be available for RAG functionality.
- Ollama must be available for local embedding/generation functionality when using the local AI pipeline.
- Firebase service account credentials are required for file storage operations.
- Generated Dockerfiles (`Dockerfile.*.generated`) should not be edited manually.
- Workspace packages are automatically discovered from the root `package.json`.
- Adding a new workspace package does not require manually updating the Docker dependency `COPY` instructions.
- Adding a new application requires adding its build/entrypoint configuration to `scripts/generate-dockerfile.js`.
