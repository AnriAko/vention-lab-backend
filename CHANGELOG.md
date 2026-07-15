# Changelog

## 0.1.0

### Add

- PostgreSQL RLS (app.current_user / app.current_organization)
- PrismaRlsService + OrganizationGuard (x-organization-id)
- SkipOrganization for auth refresh/logout
- Chat.organizationId

### Change

- Tenant modules (user, org, search, user-stats) use PrismaRlsService
- Search no longer public; user-stats ADMIN-only
- Org header required on protected routes

### Public / no org

- Health, login
- Refresh / logout (SkipOrganization)
