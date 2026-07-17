import { Injectable } from '@nestjs/common';

import { AppException } from '~/common/errors';
import { PrismaService } from '~/infrastructure/database/prisma.service';
import { Prisma } from '~/generated/prisma/client';
import { UserErrors } from '~/modules/user/user.errors';
import { UserOrganization } from '~/common/types/user-organization.types';

import { CreateOrganizationDto } from './requests/create-organization.request.dto';
import { UpdateOrganizationDto } from './requests/update-organization.request.dto';
import { Organization, OrganizationRole } from '~/generated/prisma/client';

@Injectable()
export class OrganizationsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAllOffset(page: number, limit: number) {
        const skip = (page - 1) * limit;

        const [organizations, total] = await Promise.all([
            this.prisma.organization.findMany({
                where: { isDeleted: false },
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

    findById(id: string): Promise<Organization | null> {
        return this.prisma.organization.findUnique({
            where: {
                id,
            },
        });
    }

    private mapUserOrganization(membership: {
        role: OrganizationRole;
        organization: Organization;
    }): UserOrganization {
        return {
            id: membership.organization.id,
            name: membership.organization.name,
            createdAt: membership.organization.createdAt,
            updatedAt: membership.organization.updatedAt,
            isDeleted: membership.organization.isDeleted,
            role: membership.role,
        };
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
                include: { organization: true },
            }),
            this.prisma.usersOrganizationsRoles.count({ where }),
        ]);

        return {
            data: memberships.map((membership) =>
                this.mapUserOrganization(membership)
            ),
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

    async create(dto: CreateOrganizationDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: dto.userId,
                isDeleted: false,
            },
            select: { id: true },
        });

        if (!user) {
            throw new AppException(UserErrors.NOT_FOUND);
        }

        return this.prisma.$transaction(async (transaction) => {
            const organization = await transaction.organization.create({
                data: {
                    name: dto.organizationName,
                },
            });

            await this.attachAdmin(transaction, organization.id, user.id);

            return organization;
        });
    }

    update(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
        return this.prisma.organization.update({
            where: { id },
            data: {
                ...(dto.organizationName !== undefined && {
                    name: dto.organizationName,
                }),
            },
        });
    }

    restore(id: string): Promise<Organization> {
        return this.prisma.organization.update({
            where: { id },
            data: {
                isDeleted: false,
            },
        });
    }

    softDelete(id: string): Promise<Organization> {
        return this.prisma.organization.update({
            where: { id },
            data: {
                isDeleted: true,
            },
        });
    }
}
