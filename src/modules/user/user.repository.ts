import { Injectable } from '@nestjs/common';

import { PrismaRlsClient } from '~/infrastructure/database/prisma-rls.client';
import type { Prisma } from '~/generated/prisma/client';

import { UserSafe, userSelectSafe } from '~/common/types/user.types';
import { CreateUserDto } from './requests/create-user.request.dto';
import { UpdateUserDto } from './requests/update-user.request.dto';

import { OrganizationRole } from '~/generated/prisma/enums';
import { SortDirection } from '~/common/types/sort-order.enum';

import { requestContext } from '~/infrastructure/context/request/request-context';
import { getActiveOrgId } from '~/infrastructure/context/organization/organization-context';

import { AppException } from '~/common/errors';
import { UserErrors } from './user.errors';
import {
    activeUserScope,
    deletedOrganizationUserScope,
    organizationUserScope,
} from '~/infrastructure/database/scopes/user-scope';
import { addWhere } from '~/infrastructure/database/scopes/addWhere';

@Injectable()
export class UserRepository {
    constructor(private readonly prisma: PrismaRlsClient) {}

    async findAllOffset(page: number, limit: number) {
        const skip = (page - 1) * limit;

        const where = organizationUserScope();

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
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
                where,
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
        return this.prisma.user.findFirst({
            where: addWhere(organizationUserScope(), {
                id,
            }),
            select: userSelectSafe,
        });
    }

    async existsById(id: string): Promise<boolean> {
        const user = await this.prisma.user.findFirst({
            where: addWhere(activeUserScope(), {
                id,
            }),
            select: {
                id: true,
            },
        });

        return Boolean(user);
    }

    findCurrentUser(): Promise<UserSafe | null> {
        const userId = requestContext.getStore()?.userId;

        if (!userId) {
            throw new Error('Missing user context');
        }

        return this.prisma.user.findFirst({
            where: addWhere(activeUserScope(), {
                id: userId,
            }),
            select: userSelectSafe,
        });
    }

    findByEmail(email: string): Promise<UserSafe | null> {
        return this.prisma.user.findFirst({
            where: addWhere(activeUserScope(), {
                email,
            }),
            select: userSelectSafe,
        });
    }

    create(
        dto: Omit<CreateUserDto, 'password'> & { password: string },
        transaction?: Prisma.TransactionClient,
        membershipRole: OrganizationRole = OrganizationRole.USER
    ): Promise<UserSafe> {
        const organizationId = getActiveOrgId();
        const client = transaction ?? this.prisma;

        return client.user.create({
            data: {
                ...dto,
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

    async update(id: string, dto: UpdateUserDto): Promise<UserSafe> {
        const user = await this.findById(id);

        if (!user) {
            throw new AppException(UserErrors.NOT_FOUND);
        }

        return this.prisma.user.update({
            where: {
                id,
            },
            data: dto,
            select: userSelectSafe,
        });
    }

    async restore(id: string): Promise<UserSafe> {
        const user = await this.prisma.user.findFirst({
            where: addWhere(deletedOrganizationUserScope(), {
                id,
            }),
            select: {
                id: true,
            },
        });

        if (!user) {
            throw new AppException(UserErrors.NOT_FOUND);
        }

        return this.prisma.user.update({
            where: {
                id,
            },
            data: {
                isDeleted: false,
            },
            select: userSelectSafe,
        });
    }

    async softDelete(id: string): Promise<UserSafe> {
        const user = await this.findById(id);

        if (!user) {
            throw new AppException(UserErrors.NOT_FOUND);
        }

        return this.prisma.user.update({
            where: {
                id,
            },
            data: {
                isDeleted: true,
            },
            select: userSelectSafe,
        });
    }
}
