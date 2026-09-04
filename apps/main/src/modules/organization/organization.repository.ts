import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/infrastructure/database/prisma.service';
import { organizationSelectSafe } from '~/infrastructure/database/selects/organization.types';
import type { OrganizationSafe } from '~/infrastructure/database/selects/organization.types';
import type { UserSafe } from '~/infrastructure/database/selects/user.types';
import { Prisma } from '~/generated/prisma/client';

import { CreateOrganizationDto } from './requests/create-organization.request.dto';
import { UpdateOrganizationDto } from './requests/update-organization.request.dto';
import { OrganizationRole } from '~/generated/prisma/client';
import { paginatePrisma } from '~/common/api/pagination/paginate-prisma';
import type { Pagination } from '~/common/api/pagination/pagination.schema';

@Injectable()
export class OrganizationsRepository {
    constructor(private readonly prisma: PrismaService) {}

    findAll(pagination: Pagination) {
        return paginatePrisma({
            pagination,
            model: this.prisma.organization,
            where: {
                isDeleted: false,
            },
            select: organizationSelectSafe,
            orderBy: {
                name: 'asc',
            },
        });
    }

    findAllDeleted(pagination: Pagination) {
        return paginatePrisma({
            pagination,
            model: this.prisma.organization,
            where: {
                isDeleted: true,
            },
            select: organizationSelectSafe,
            orderBy: {
                name: 'asc',
            },
        });
    }

    findById(id: string): Promise<OrganizationSafe | null> {
        return this.prisma.organization.findUnique({
            where: {
                id,
            },
            select: organizationSelectSafe,
        });
    }

    findAllByUserId(userId: string, pagination: Pagination) {
        return paginatePrisma({
            pagination,
            model: this.prisma.usersOrganizationsRoles,
            where: {
                userId,
                organization: {
                    isDeleted: false,
                    users: {
                        some: {
                            userId,
                            isDeleted: false,
                        },
                    },
                },
            },
            orderBy: {
                organization: {
                    name: 'asc',
                },
            },
            select: {
                role: true,
                organization: {
                    select: organizationSelectSafe,
                },
            },
        });
    }

    findMembershipsByUserId(userId: string) {
        return this.prisma.usersOrganizationsRoles.findMany({
            where: {
                userId,
                organization: {
                    isDeleted: false,
                    users: {
                        some: {
                            userId,
                            isDeleted: false,
                        },
                    },
                },
            },
            orderBy: { organization: { name: 'asc' } },
            select: {
                role: true,
                organization: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
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
