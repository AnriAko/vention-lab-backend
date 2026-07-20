# Changelog

## Prisma / Database / Infrastructure

- Extended the multi-tenant schema with organization-scoped membership roles (`UsersOrganizationsRoles`), `organizationId` on `Chat`, and soft-delete support across tenant entities.
- Added PostgreSQL Row Level Security policies for `Organization`, `UsersOrganizations`, `UsersOrganizationsRoles`, `Owner`, `User`, `File`, `Chat`, `UsersChats`, and `Message`.
- Policies rely on session variables (`app.current_user`, `app.current_organization`, `app.current_role`) with OWNER bypass and organization-scoped membership checks.
- Added RLS-oriented indexes on organization and relation foreign keys to keep policy evaluation efficient.
- Introduced `PrismaRlsService` / `PrismaRlsClient` with request-scoped interactive transactions that set RLS session config before queries.
- Expanded `requestContext` (ALS) to carry `userId`, `organizationId`, `role`, and the active Prisma transaction for tenant-aware execution.
- Wired RLS into the request pipeline through `OrganizationGuard`, `PrismaRlsInterceptor`, and global filter/logging integration.
- Updated seed and clean scripts for the new schema (memberships, org roles, org-scoped chats/files).
- Added Prisma explain/execute helper scripts and improved Prisma logging.
- Hardened HTTP surface with Helmet and rate limiting (`ThrottlerModule`).

### Current RLS Request Flow

```
Guards - Identify user, organization, and permissions.
ALS - Stores request identity and active transaction context.
Interceptor - Enables RLS for tenant-scoped requests.
RlsService - Creates transaction and passes identity to PostgreSQL.
RlsClient - Ensures tenant queries cannot bypass RLS context.
PostgreSQL RLS - Enforces final data isolation at database level.
```

---

## Common / Shared Architecture

- Established Zod as the single source of truth for request + response contracts and OpenAPI docs.
- Introduced `createResponseSchema(...)` and `DateTimeResponse` to define response schemas once (runtime serialization + Swagger from the same Zod schema).
- Added a unified `@ApiResponse(ResponseSchema)` decorator that wires Swagger + response serialization via `nestjs-zod` `@ZodResponse` internally (no separate Swagger DTO classes).
- Documented auth in OpenAPI: Bearer (`access-token`), org header (`organization-id`), refresh cookie; `@Roles` / `@PublicRoute` / `@SkipOrganization` now also emit Swagger metadata (`x-required-roles`, `x-guest`, `x-skip-organization`).
- Added `@ApiEndpoint` / `@ApiOrganizationHeader` helpers and seed-backed request examples (`src/common/swagger/seed-examples.ts`).
- `@Roles` on a handler overrides class-level roles in both guards and Swagger (`x-required-roles` + description role line).
- Standardized the public success envelope via `ApiResponseInterceptor` (wraps handler output into `{ success, requestId, timestamp, data }`).
- Added shared reusable responses: `MessageResponse`, `TokenResponse`, `EmptyResponse`.
- Standardized offset pagination request DTO (`OffsetPaginationQuery`) and response helper (`createOffsetPaginated`).
- Introduced domain-oriented error handling:
    - `AppException` for typed application errors
    - `CommonErrors` for infrastructure/fallback codes
    - per-module `*.errors.ts` for domain-specific codes/messages
- Updated `HttpExceptionFilter` and `PrismaExceptionFilter` to emit stable `errorCode` values from domain/common errors.
- Removed service-level response mappers in favor of global Zod response serialization (schema acts as the whitelist, preventing internal fields from leaking).
- Consolidated shared role typing through `AppRole` and organization-member shared types.

### Module structure reference

```
module/
├── requests/
│   *.request.dto.ts
├── responses/
│   *.response.ts
├── module.controller.ts
├── module.service.ts
├── module.repository.ts
├── module.errors.ts
└── module.module.ts
```

---

## Module Changes

### Auth

- Cookie-based JWT auth with Redis-backed refresh/token invalidation.
- Domain errors in `auth.errors.ts` (`AUTH_INVALID_CREDENTIALS`, token errors, etc.).
- Request/response split: `requests/sign-in.request.dto.ts`, `responses/login.response.dto.ts`.
- Moved auth-only data access into `auth.repository.ts` (`AuthRepository`); removed from the user module.
- Guards (`AuthGuard`, `OrganizationGuard`, `RolesGuard`) throw `AppException` with domain error codes.

### User

- Tenant-aware user CRUD with soft delete/restore and consistent **offset pagination** for list endpoints.
- **`GET /users/me`** — safe profile for the authenticated user in the active organization (`@Roles(USER)` overrides class-level admin gate); documented in Swagger via `@ApiEndpoint` + `UserResponse`.
- Request/response DTO split under `requests/` and `responses/`.
- Domain error `USER_NOT_FOUND`.
- Removed dedicated admin controller in favor of role-gated user routes.
- Removed auth lookup path from `UsersService` after auth repository move.

### Organization

- Owner-scoped organization management (create, update, soft delete/restore).
- **`GET /organizations/me`** — offset-paginated organizations for the authenticated user, each with membership `role` (`USER+`, `@SkipOrganization`); Swagger: `UserOrganizationListResponse`.
- **`GET /organizations/users/:userId`** — same payload for a specific user (platform `OWNER` only); seed-backed `userId` example in OpenAPI.
- Create organization with existing admin user, or create organization + new admin in one transaction.
- Request/response DTO split; domain errors for missing organization and access denial.
- Added `UserOrganizationResponse` / `UserOrganizationListResponse` contracts (org fields + `role`).
- Repository interactions updated for membership/role attachment.

### Member

- Module for listing members, role management, and membership removal under RLS (not user profile CRUD — that stays in **User**).
- **`GET /organizations/:organizationId/members`** — all active members with roles; **`GET .../deleted`** — soft-deleted members still linked to the org.
- **`GET /organizations/:organizationId/members/admins`** — offset-paginated `ADMIN` members only; reuses `MemberListResponse` in Swagger.
- **`PATCH .../:userId/role`** and **`DELETE .../:userId`** for role assignment and membership removal.
- Removed **`GET .../:userId`** (single member by id) as duplicate of `GET /users/:id` within the same organization.
- Request DTOs for org/member params and role updates; response DTOs for member payloads.
- Domain errors for missing members and post-assignment consistency failures.
- Tenant routes documented with `@ApiOrganizationHeader` and `@ApiEndpoint` role notes in Swagger.

### Search

- Full-text and substring search endpoints with Zod-validated query DTO.
- Optimized search repository/query separation.
- Response contracts for search hits and substring results reusing `UserResponse` / `OrganizationResponse`.

### User Stats

- Message leaderboard endpoints (Prisma query vs raw SQL) returning a consistent offset-paginated contract (`{ items, pagination }`).
- Dedicated `LeaderboardResponse` contract under `responses/`.

### Health

- Health check endpoint documenting Terminus payload via `HealthCheckResponse`.
- Public, un throttled route for infrastructure probes.
