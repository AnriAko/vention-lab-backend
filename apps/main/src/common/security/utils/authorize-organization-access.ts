import { AppException } from '~/common/errors/app-exception';
import type { AuthUser } from '~/common/security/auth.types';
import { AppRole } from '~/common/security/permissions/app-role.enum';
import { OrganizationRole } from '~/generated/prisma/enums';
import type { PrismaService } from '~/infrastructure/database/prisma.service';
import { AuthErrors } from '~/modules/auth/auth.errors';
import { OrganizationErrors } from '~/modules/organization/organization.errors';

export function assertClaimedOrganizationRole(
    claimedRole: string | undefined,
    required: boolean
): void {
    if (!claimedRole) {
        if (required) {
            throw new AppException(
                OrganizationErrors.MISSING_ORGANIZATION_ROLE
            );
        }

        return;
    }

    if (
        claimedRole !== OrganizationRole.USER &&
        claimedRole !== OrganizationRole.ADMIN
    ) {
        throw new AppException(OrganizationErrors.INVALID_ORGANIZATION_ROLE);
    }
}

export async function authorizeOrganizationAccess(
    prisma: PrismaService,
    user: AuthUser | undefined,
    organizationId: string
): Promise<AuthUser> {
    if (!user?.userId) {
        throw new AppException(AuthErrors.MISSING_AUTHENTICATED_USER);
    }

    if (user.role === AppRole.OWNER) {
        const organization = await prisma.organization.findUnique({
            where: {
                id: organizationId,
                isDeleted: false,
            },
            select: { id: true },
        });

        if (!organization) {
            throw new AppException(OrganizationErrors.ACCESS_DENIED);
        }

        return {
            userId: user.userId,
            role: AppRole.OWNER,
            organizationId,
        };
    }

    const membership = await prisma.usersOrganizations.findFirst({
        where: {
            userId: user.userId,
            organizationId,
            isDeleted: false,
        },
    });

    if (!membership) {
        throw new AppException(OrganizationErrors.ACCESS_DENIED);
    }

    const orgRole = await prisma.usersOrganizationsRoles.findUnique({
        where: {
            userId_organizationId: {
                userId: user.userId,
                organizationId,
            },
        },
    });

    if (!orgRole) {
        throw new AppException(OrganizationErrors.ACCESS_DENIED);
    }

    return {
        userId: user.userId,
        role: orgRole.role as AppRole,
        organizationId,
    };
}
