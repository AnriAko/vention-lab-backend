import { Injectable } from '@nestjs/common';

import {
    PrismaRlsClient,
    requestContext,
    getActiveOrgId,
} from '~/common/tenancy';
import type { Prisma } from '~/generated/prisma/client';

import {
    UserSafe,
    userSelectSafe,
    organizationUserScope,
    addWhere,
} from '~/infrastructure/database';
import { CreateUserDto } from './requests/create-user.request.dto';
import { UpdateUserDto } from './requests/update-user.request.dto';

import { OrganizationRole } from '~/generated/prisma/enums';

import { AppException } from '~/common/errors';
import { UserErrors } from './user.errors';

@Injectable()
export class UserRepository {
    constructor(private readonly prisma: PrismaRlsClient) {}

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
            where: {
                id,
            },
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
            where: {
                id: userId,
            },
            select: userSelectSafe,
        });
    }

    findByEmail(email: string): Promise<UserSafe | null> {
        return this.prisma.user.findFirst({
            where: {
                email,
            },
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
}
