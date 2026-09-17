import { Injectable } from '@nestjs/common';

import { AppException } from '~/common/errors/app-exception';
import { PrismaRlsClient } from '~/common/tenancy/rls/prisma-rls.client';
import { requestContext } from '~/common/tenancy/request-context/request-context';
import { getActiveOrgId } from '~/common/tenancy/organization/organization-context';
import type { Prisma } from '~/generated/prisma/client';
import { PrismaService } from '~/infrastructure/database/prisma.service';

import { userSelectSafe } from '~/infrastructure/database/selects/user.types';
import type { UserSafe } from '~/infrastructure/database/selects/user.types';
import { organizationUserScope } from '~/infrastructure/database/scopes/user-scope';
import { addWhere } from '~/infrastructure/database/scopes/addWhere';
import { CreateUserDto } from './requests/create-user.request.dto';
import { UpdateUserDto } from './requests/update-user.request.dto';

import { OrganizationRole } from '~/generated/prisma/enums';

import { UserErrors } from './user.errors';
import { AuthErrors } from '~/modules/auth/auth.errors';

@Injectable()
export class UserRepository {
    constructor(
        private readonly prisma: PrismaRlsClient,
        private readonly prismaService: PrismaService
    ) {}

    findById(id: string): Promise<UserSafe | null> {
        return this.prisma.user.findFirst({
            where: addWhere(organizationUserScope(), {
                id,
            }),
            select: userSelectSafe,
        });
    }

    async existsById(id: string): Promise<boolean> {
        const user = await this.prismaService.user.findFirst({
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
            throw new AppException(AuthErrors.MISSING_AUTHENTICATED_USER);
        }

        return this.prismaService.user.findFirst({
            where: {
                id: userId,
            },
            select: userSelectSafe,
        });
    }

    findByEmail(email: string): Promise<UserSafe | null> {
        return this.prismaService.user.findFirst({
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
        const organizationId = dto.organizationId || getActiveOrgId();
        const client = transaction ?? this.prisma;

        const { organizationId: _, ...userData } = dto;

        return client.user.create({
            data: {
                ...userData,
                organizations: {
                    createMany: {
                        data: {
                            organizationId,
                        },
                        skipDuplicates: true,
                    },
                },
                organizationRoles: {
                    createMany: {
                        data: {
                            organizationId,
                            role: membershipRole,
                        },
                        skipDuplicates: true,
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
