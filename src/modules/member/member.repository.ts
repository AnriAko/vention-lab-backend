import { Injectable } from '@nestjs/common';

import { AppException } from '~/common/errors';
import { PrismaRlsClient } from '~/infrastructure/database/prisma-rls.client';
import { memberSelect } from '~/common/types/member.types';
import { OrganizationRole } from '~/generated/prisma/enums';
import { UserErrors } from '~/modules/user/user.errors';
import { MemberErrors } from './member.errors';
import { getActiveOrgId } from '~/infrastructure/context/organization/organization-context';
import { activeOrganizationScope } from '~/infrastructure/database/scopes/organization-scope';
import { addWhere } from '~/infrastructure/database/scopes/addWhere';

@Injectable()
export class MemberRepository {
    constructor(private readonly prisma: PrismaRlsClient) {}

    async findAllOffset(page: number, limit: number) {
        const organizationId = getActiveOrgId();
        const skip = (page - 1) * limit;

        const where = activeOrganizationScope();

        const [members, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: memberSelect(organizationId),
                orderBy: {
                    name: 'asc',
                },
                skip,
                take: limit,
            }),

            this.prisma.user.count({
                where,
            }),
        ]);

        return {
            data: members,
            meta: {
                page,
                limit,
                total,
            },
        };
    }

    async findAllDeletedOffset(page: number, limit: number) {
        const organizationId = getActiveOrgId();
        const skip = (page - 1) * limit;

        const where = addWhere(activeOrganizationScope(), {
            isDeleted: true,
        });

        const [members, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: memberSelect(organizationId),
                orderBy: {
                    name: 'asc',
                },
                skip,
                take: limit,
            }),

            this.prisma.user.count({
                where,
            }),
        ]);

        return {
            data: members,
            meta: {
                page,
                limit,
                total,
            },
        };
    }

    async findAllAdminsOffset(page: number, limit: number) {
        const organizationId = getActiveOrgId();
        const skip = (page - 1) * limit;

        const where = addWhere(activeOrganizationScope(), {
            organizationRoles: {
                some: {
                    organizationId,
                    role: OrganizationRole.ADMIN,
                },
            },
        });

        const [members, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: memberSelect(organizationId),
                orderBy: {
                    name: 'asc',
                },
                skip,
                take: limit,
            }),

            this.prisma.user.count({
                where,
            }),
        ]);

        return {
            data: members,
            meta: {
                page,
                limit,
                total,
            },
        };
    }

    async findById(userId: string) {
        const organizationId = getActiveOrgId();

        return this.prisma.user.findFirst({
            where: addWhere(activeOrganizationScope(), {
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
            where: addWhere(activeOrganizationScope(), {
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
            where: addWhere(activeOrganizationScope(), {
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

    async remove(userId: string): Promise<void> {
        const organizationId = getActiveOrgId();

        await this.prisma.usersOrganizationsRoles.delete({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId,
                },
            },
        });

        await this.prisma.usersOrganizations.delete({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId,
                },
            },
        });
    }
}
