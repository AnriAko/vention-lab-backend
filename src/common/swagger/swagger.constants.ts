import { AUTH_HEADER } from '~/common/types/auth.types';
import { AuthCookie } from '~/modules/auth/auth.constants';
import {
    SEED_LOGIN_MEMBER,
    SEED_LOGIN_ORG_ADMIN,
    SEED_LOGIN_OWNER,
    SEED_ORGANIZATIONS,
    SEED_PASSWORD,
    SEED_USERS,
} from './seed-examples';

/** Security scheme names registered in `main.ts` DocumentBuilder. */
export const SWAGGER_AUTH = {
    ACCESS_TOKEN: 'access-token',
    ORGANIZATION_ID: 'organization-id',
    REFRESH_TOKEN: 'refresh-token',
} as const;

export const SWAGGER_API_DESCRIPTION = `
Multi-tenant NestJS API with JWT auth, organization scoping (\`${AUTH_HEADER.ORGANIZATION_ID}\`), and PostgreSQL RLS.

## Auth quick start (after \`npm run prisma:seed\`)

1. **Guest**: \`GET /api/health\` — no token.

2. **Login**: \`POST /api/auth/login\` with a seeded account (see below). Copy \`accessToken\` from the response.

3. **Authorize** in Swagger: paste the token into **access-token** (Bearer).

4. **Tenant routes**: also set **organization-id** to a seeded org UUID (e.g. CatFans).

5. **Platform owner routes** (\`/organizations\`): Bearer only — no org header (\`@SkipOrganization\`).

6. **Refresh**: needs Bearer + httpOnly cookie \`${AuthCookie.REFRESH_TOKEN}\` from login (browser/cookie jar).

### Seeded accounts (password: \`${SEED_PASSWORD}\`)

| Role | Email | Notes |
|------|-------|-------|
| OWNER | \`${SEED_LOGIN_OWNER.email}\` | Platform owner; use for \`/organizations\` |
| ADMIN | \`${SEED_LOGIN_ORG_ADMIN.email}\` | CatFans admin; use with org header |
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

Hierarchy: \`USER\` < \`ADMIN\` < \`OWNER\`. Endpoints declare the **minimum** role via \`@Roles(...)\`. Guest routes use \`@PublicRoute()\`.
`.trim();
