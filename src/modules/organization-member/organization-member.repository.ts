import { Injectable } from '@nestjs/common';

import { AppException } from '~/common/errors';
import { PrismaRlsClient } from '~/infrastructure/database/prisma-rls.client';
import { requestContext } from '~/infrastructure/context/request-context';
import { organizationMemberSelect } from '~/common/types/organization-member.types';
import { OrganizationRole } from '~/generated/prisma/enums';
import { UserErrors } from '~/modules/user/user.errors';
import { OrganizationMemberErrors } from './organization-member.errors';

@Injectable()
export class OrganizationMemberRepository {
    constructor(private readonly prisma: PrismaRlsClient) {}

    private activeOrganizationId(): string {
        const organizationId = requestContext.getStore()?.organizationId;
        if (!organizationId) {
            throw new Error('Missing organization context');
        }
        return organizationId;
    }

    async findAllOffset(page: number, limit: number) {
        const organizationId = this.activeOrganizationId();
        const skip = (page - 1) * limit;

        const where = {
            isDeleted: false,
            organizations: {
                some: { organizationId },
            },
        } as const;

        const [members, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: organizationMemberSelect(organizationId),
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
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
        const organizationId = this.activeOrganizationId();
        const skip = (page - 1) * limit;

        const where = {
            isDeleted: true,
            organizations: {
                some: { organizationId },
            },
        } as const;

        const [members, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: organizationMemberSelect(organizationId),
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
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
        const organizationId = this.activeOrganizationId();
        const skip = (page - 1) * limit;

        const where = {
            isDeleted: false,
            organizations: {
                some: { organizationId },
            },
            organizationRoles: {
                some: {
                    organizationId,
                    role: OrganizationRole.ADMIN,
                },
            },
        } as const;

        const [members, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: organizationMemberSelect(organizationId),
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
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
        const organizationId = this.activeOrganizationId();

        const member = await this.prisma.user.findUnique({
            where: {
                id: userId,
                isDeleted: false,
                organizations: {
                    some: { organizationId },
                },
            },
            select: organizationMemberSelect(organizationId),
        });

        return member;
    }

    async assignRole(
        userId: string,
        role: OrganizationRole | 'USER' | 'ADMIN'
    ) {
        const organizationId = this.activeOrganizationId();

        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
                isDeleted: false,
            },
            select: { id: true },
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
            update: { role },
        });

        const member = await this.prisma.user.findUnique({
            where: { id: userId },
            select: organizationMemberSelect(organizationId),
        });

        if (!member) {
            throw new AppException(
                OrganizationMemberErrors.NOT_FOUND_AFTER_ROLE_ASSIGNMENT
            );
        }

        return member;
    }

    async remove(userId: string): Promise<void> {
        const organizationId = this.activeOrganizationId();

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
