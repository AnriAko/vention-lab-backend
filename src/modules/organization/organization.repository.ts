import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/infrastructure/database/prisma.service';
import { Prisma } from '~/generated/prisma/client';
import {
    OrganizationSafe,
    organizationSelectSafe,
} from '~/common/types/organization.types';
import type { UserSafe } from '~/common/types/user.types';

import { CreateOrganizationDto } from './requests/create-organization.request.dto';
import { UpdateOrganizationDto } from './requests/update-organization.request.dto';
import { OrganizationRole } from '~/generated/prisma/client';

@Injectable()
export class OrganizationsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAllOffset(page: number, limit: number) {
        const skip = (page - 1) * limit;

        const [organizations, total] = await Promise.all([
            this.prisma.organization.findMany({
                where: { isDeleted: false },
                select: organizationSelectSafe,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            this.prisma.organization.count({ where: { isDeleted: false } }),
        ]);

        return {
            data: organizations,
            meta: {
                page,
                limit,
                total,
            },
        };
    }

    async findAllDeletedOffset(page: number, limit: number) {
        const skip = (page - 1) * limit;

        const [organizations, total] = await Promise.all([
            this.prisma.organization.findMany({
                where: { isDeleted: true },
                select: organizationSelectSafe,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            this.prisma.organization.count({ where: { isDeleted: true } }),
        ]);

        return {
            data: organizations,
            meta: {
                page,
                limit,
                total,
            },
        };
    }

    findById(id: string): Promise<OrganizationSafe | null> {
        return this.prisma.organization.findUnique({
            where: {
                id,
            },
            select: organizationSelectSafe,
        });
    }

    async findAllByUserIdOffset(userId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;

        const where = {
            userId,
            organization: { isDeleted: false },
        } as const;

        const [memberships, total] = await Promise.all([
            this.prisma.usersOrganizationsRoles.findMany({
                where,
                skip,
                take: limit,
                orderBy: { organization: { name: 'asc' } },
                select: {
                    role: true,
                    organization: {
                        select: organizationSelectSafe,
                    },
                },
            }),
            this.prisma.usersOrganizationsRoles.count({ where }),
        ]);

        return {
            data: memberships,
            meta: {
                page,
                limit,
                total,
            },
        };
    }

    private async attachAdmin(
        transaction: Prisma.TransactionClient,
        organizationId: string,
        userId: string
    ) {
        await transaction.usersOrganizations.create({
            data: {
                userId,
                organizationId,
            },
        });

        await transaction.usersOrganizationsRoles.create({
            data: {
                userId,
                organizationId,
                role: OrganizationRole.ADMIN,
            },
        });
    }

    async create(dto: CreateOrganizationDto): Promise<OrganizationSafe> {
        return this.prisma.$transaction(async (transaction) => {
            const organization = await transaction.organization.create({
                data: {
                    name: dto.organizationName,
                },
                select: organizationSelectSafe,
            });

            await this.attachAdmin(transaction, organization.id, dto.userId);

            return organization;
        });
    }

    async createWithAdmin(
        organizationName: string,
        createAdmin: (
            transaction: Prisma.TransactionClient,
            organizationId: string
        ) => Promise<UserSafe>
    ): Promise<{ organization: OrganizationSafe; user: UserSafe }> {
        return this.prisma.$transaction(async (transaction) => {
            const organization = await transaction.organization.create({
                data: {
                    name: organizationName,
                },
                select: organizationSelectSafe,
            });

            const user = await createAdmin(transaction, organization.id);

            return {
                organization,
                user,
            };
        });
    }

    update(id: string, dto: UpdateOrganizationDto): Promise<OrganizationSafe> {
        return this.prisma.organization.update({
            where: { id },
            data: {
                ...(dto.organizationName !== undefined && {
                    name: dto.organizationName,
                }),
            },
            select: organizationSelectSafe,
        });
    }

    restore(id: string): Promise<OrganizationSafe> {
        return this.prisma.organization.update({
            where: { id },
            data: {
                isDeleted: false,
            },
            select: organizationSelectSafe,
        });
    }

    softDelete(id: string): Promise<OrganizationSafe> {
        return this.prisma.organization.update({
            where: { id },
            data: {
                isDeleted: true,
            },
            select: organizationSelectSafe,
        });
    }
}
