import { Injectable } from '@nestjs/common';

import { AppException } from '~/common/errors/app-exception';
import { PrismaRlsClient } from '~/common/tenancy/rls/prisma-rls.client';
import { getActiveOrgId } from '~/common/tenancy/organization/organization-context';
import { memberSelect } from '~/infrastructure/database/selects/member.types';
import {
    activeTenantSoftDeleteScope,
    deletedTenantMembershipScope,
} from '~/infrastructure/database/scopes/organization-scope';
import { addWhere } from '~/infrastructure/database/scopes/addWhere';
import { OrganizationRole } from '~/generated/prisma/enums';
import { UserErrors } from '~/modules/user/user.errors';
import { MemberErrors } from './member.errors';
import { paginatePrisma } from '~/common/api/pagination/paginate-prisma';
import type { Pagination } from '~/common/api/pagination/pagination.schema';

@Injectable()
export class MemberRepository {
    constructor(private readonly prisma: PrismaRlsClient) {}

    findAll(pagination: Pagination) {
        const organizationId = getActiveOrgId();

        return paginatePrisma({
            pagination,
            model: this.prisma.user,
            where: activeTenantSoftDeleteScope(),
            select: memberSelect(organizationId),
            orderBy: {
                name: 'asc',
            },
        });
    }

    findAllDeleted(pagination: Pagination) {
        const organizationId = getActiveOrgId();

        return paginatePrisma({
            pagination,
            model: this.prisma.user,
            where: deletedTenantMembershipScope(),
            select: memberSelect(organizationId),
            orderBy: {
                name: 'asc',
            },
        });
    }

    findAllAdmins(pagination: Pagination) {
        const organizationId = getActiveOrgId();

        return paginatePrisma({
            pagination,
            model: this.prisma.user,
            where: addWhere(activeTenantSoftDeleteScope(), {
                organizationRoles: {
                    some: {
                        organizationId,
                        role: OrganizationRole.ADMIN,
                    },
                },
            }),
            select: memberSelect(organizationId),
            orderBy: {
                name: 'asc',
            },
        });
    }

    async findById(userId: string) {
        const organizationId = getActiveOrgId();

        return this.prisma.user.findFirst({
            where: addWhere(activeTenantSoftDeleteScope(), {
                id: userId,
            }),
            select: memberSelect(organizationId),
        });
    }

    async findDeletedById(userId: string) {
        const organizationId = getActiveOrgId();

        return this.prisma.user.findFirst({
            where: addWhere(deletedTenantMembershipScope(), {
                id: userId,
            }),
            select: memberSelect(organizationId),
        });
    }

    async assignRole(
        userId: string,
        role: OrganizationRole | 'USER' | 'ADMIN'
    ) {
        const organizationId = getActiveOrgId();

        const user = await this.prisma.user.findFirst({
            where: addWhere(activeTenantSoftDeleteScope(), {
                id: userId,
            }),
            select: {
                id: true,
            },
        });

        if (!user) {
            throw new AppException(UserErrors.NOT_FOUND);
        }

        await this.prisma.usersOrganizations.upsert({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId,
                },
            },
            create: {
                userId,
                organizationId,
            },
            update: {},
        });

        await this.prisma.usersOrganizationsRoles.upsert({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId,
                },
            },
            create: {
                userId,
                organizationId,
                role,
            },
            update: {
                role,
            },
        });

        const member = await this.prisma.user.findFirst({
            where: addWhere(activeTenantSoftDeleteScope(), {
                id: userId,
            }),
            select: memberSelect(organizationId),
        });

        if (!member) {
            throw new AppException(
                MemberErrors.NOT_FOUND_AFTER_ROLE_ASSIGNMENT
            );
        }

        return member;
    }

    async softRemove(userId: string): Promise<void> {
        const organizationId = getActiveOrgId();

        await this.prisma.usersOrganizations.update({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId,
                },
            },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        });
    }

    async restore(userId: string) {
        const organizationId = getActiveOrgId();

        await this.prisma.usersOrganizations.update({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId,
                },
            },
            data: {
                isDeleted: false,
                deletedAt: null,
            },
        });

        const member = await this.findById(userId);

        if (!member) {
            throw new AppException(MemberErrors.NOT_FOUND);
        }

        return member;
    }
}
