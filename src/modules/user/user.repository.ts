import { Injectable } from '@nestjs/common';

import { PrismaRlsClient } from '~/infrastructure/database/prisma-rls.client';
import { PrismaService } from '~/infrastructure/database/prisma.service';
import type { Prisma } from '~/generated/prisma/client';
import { UserSafe, userSelectSafe } from '~/common/types/user.types';
import { CreateUserDto } from './requests/create-user.request.dto';
import { UpdateUserDto } from './requests/update-user.request.dto';
import { OrganizationRole } from '~/generated/prisma/enums';
import { SortDirection } from '~/common/types/sort-order.enum';
import { requestContext } from '~/infrastructure/context/request-context';

@Injectable()
export class UserRepository {
    constructor(
        private readonly prisma: PrismaRlsClient,
        private readonly prismaService: PrismaService
    ) {}

    private activeOrganizationId(): string {
        const organizationId = requestContext.getStore()?.organizationId;
        if (!organizationId) {
            throw new Error('Missing organization context');
        }
        return organizationId;
    }

    private memberWhere(organizationId: string) {
        return {
            isDeleted: false,
            organizations: {
                some: { organizationId },
            },
        } as const;
    }

    async findAllOffset(page: number, limit: number) {
        const organizationId = this.activeOrganizationId();
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where: this.memberWhere(organizationId),
                skip,
                take: limit,
                select: userSelectSafe,
                orderBy: [
                    {
                        createdAt: SortDirection.DESC,
                    },
                    {
                        id: SortDirection.DESC,
                    },
                ],
            }),
            this.prisma.user.count({
                where: this.memberWhere(organizationId),
            }),
        ]);

        return {
            data: users,
            meta: {
                page,
                limit,
                total,
            },
        };
    }

    findById(id: string): Promise<UserSafe | null> {
        const organizationId = this.activeOrganizationId();

        return this.prisma.user.findUnique({
            where: {
                id,
                ...this.memberWhere(organizationId),
            },
            select: userSelectSafe,
        });
    }

    async existsById(id: string): Promise<boolean> {
        const user = await this.prismaService.user.findUnique({
            where: {
                id,
                isDeleted: false,
            },
            select: { id: true },
        });

        return user !== null;
    }

    findCurrentUser(): Promise<UserSafe | null> {
        const userId = requestContext.getStore()?.userId;
        if (!userId) {
            throw new Error('Missing user context');
        }

        return this.prismaService.user.findUnique({
            where: {
                id: userId,
                isDeleted: false,
            },
            select: userSelectSafe,
        });
    }

    findByEmail(email: string): Promise<UserSafe | null> {
        const organizationId = this.activeOrganizationId();

        return this.prisma.user.findUnique({
            where: {
                email,
                ...this.memberWhere(organizationId),
            },
            select: userSelectSafe,
        });
    }

    create(
        dto: Omit<CreateUserDto, 'password'> & { password: string },
        transaction?: Prisma.TransactionClient,
        membershipRole: OrganizationRole = OrganizationRole.USER
    ): Promise<UserSafe> {
        const organizationId = transaction
            ? dto.organizationId
            : this.activeOrganizationId();

        if (!organizationId) {
            throw new Error('Missing organizationId');
        }

        const { organizationId: _dtoOrganizationId, ...userData } = dto;
        const client = transaction ?? this.prisma;

        return client.user.create({
            data: {
                ...userData,
                organizations: {
                    create: {
                        organizationId,
                    },
                },
                organizationRoles: {
                    create: {
                        organizationId,
                        role: membershipRole,
                    },
                },
            },
            select: userSelectSafe,
        });
    }

    update(id: string, dto: UpdateUserDto): Promise<UserSafe> {
        const { organizationId: _organizationId, ...userData } = dto;

        return this.prisma.user.update({
            where: { id },
            data: userData,
            select: userSelectSafe,
        });
    }

    restore(id: string): Promise<UserSafe> {
        return this.prisma.user.update({
            where: { id },
            data: {
                isDeleted: false,
            },
            select: userSelectSafe,
        });
    }

    softDelete(id: string): Promise<UserSafe> {
        return this.prisma.user.update({
            where: { id },
            data: {
                isDeleted: true,
            },
            select: userSelectSafe,
        });
    }
}
