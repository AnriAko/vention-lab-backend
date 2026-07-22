import { AUTH_HEADER } from '~/common/security/auth.types';
import { AuthCookie } from '~/modules/auth/auth.constants';
import {
    SEED_LOGIN_MEMBER,
    SEED_LOGIN_ORG_ADMIN,
    SEED_LOGIN_OWNER,
    SEED_ORGANIZATIONS,
    SEED_PASSWORD,
    SEED_USERS,
} from './seed-examples';

export const SWAGGER_AUTH = {
    ACCESS_TOKEN: 'access-token',
    ORGANIZATION_ID: 'organization-id',
    ORGANIZATION_ROLE: 'organization-role',
    REFRESH_TOKEN: 'refresh-token',
} as const;

export const SWAGGER_API_DESCRIPTION = `
Multi-tenant NestJS API with JWT auth, organization scoping (\`${AUTH_HEADER.ORGANIZATION_ID}\` + \`${AUTH_HEADER.ORGANIZATION_ROLE}\`), and PostgreSQL RLS.

## Auth quick start (after \`npm run prisma:seed\`)

1. **Guest**: \`GET /api/health\` — no token.

2. **Login**: \`POST /api/auth/login\` with a seeded account (see below). Copy \`accessToken\` from the response.

3. **Authorize** in Swagger: paste the token into **access-token** (Bearer).

4. **Identity**: \`GET /api/users/current\` — profile only (Bearer).

5. **Memberships**: \`GET /api/orgs/current\` — organizations + role per org (Bearer).

6. **Tenant routes**: set **organization-id** and **organization-role** from the selected membership. Backend verifies membership/role from the database (header role is a hint only).

7. **Platform owner routes** (\`/orgs\` except \`/orgs/current\`): Bearer only — no org header (\`@SkipOrganization\`).

8. **Refresh**: needs Bearer + httpOnly cookie \`${AuthCookie.REFRESH_TOKEN}\` from login (browser/cookie jar).

### Seeded accounts (password: \`${SEED_PASSWORD}\`)

| Role | Email | Notes |
|------|-------|-------|
| OWNER | \`${SEED_LOGIN_OWNER.email}\` | Platform owner; use for \`/orgs\` management |
| ADMIN | \`${SEED_LOGIN_ORG_ADMIN.email}\` | CatFans admin; use with org headers |
| USER | \`${SEED_LOGIN_MEMBER.email}\` | CatFans member |

### Seeded organization IDs

| Name | ID |
|------|----|
| ${SEED_ORGANIZATIONS.catFans.name} | \`${SEED_ORGANIZATIONS.catFans.id}\` |
| ${SEED_ORGANIZATIONS.dogFans.name} | \`${SEED_ORGANIZATIONS.dogFans.id}\` |
| ${SEED_ORGANIZATIONS.birdFans.name} | \`${SEED_ORGANIZATIONS.birdFans.id}\` |

### Useful IDs for path params

| Entity | ID |
|--------|----|
| Owner user | \`${SEED_USERS.owner.id}\` |
| CatFans admin | \`${SEED_ORGANIZATIONS.catFans.adminId}\` |
| Demo member (user1) | \`${SEED_USERS.demoMember.id}\` |

### Roles

Application auth level: \`AUTHENTICATED_USER\` (logged in only; no org context).

Organization / platform hierarchy: \`USER\` < \`ADMIN\` < \`OWNER\`. Endpoints declare the **minimum** role via \`@Roles(...)\`. Guest routes use \`@PublicRoute()\`.
`.trim();
