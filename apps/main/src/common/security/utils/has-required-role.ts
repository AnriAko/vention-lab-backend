import { AppRole } from '~/common/security/permissions/app-role.enum';

const ROLE_RANK: Record<AppRole, number> = {
    [AppRole.AUTHENTICATED_USER]: 0,
    [AppRole.USER]: 1,
    [AppRole.ADMIN]: 2,
    [AppRole.OWNER]: 3,
};

export function hasRequiredRole(
    activeRole: AppRole,
    requiredRoles: AppRole[]
): boolean {
    const requiredRank = Math.min(
        ...requiredRoles.map((role) => ROLE_RANK[role])
    );

    return ROLE_RANK[activeRole] >= requiredRank;
}
