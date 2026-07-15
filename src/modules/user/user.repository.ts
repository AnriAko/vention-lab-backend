import { Injectable } from '@nestjs/common';

import { PrismaRlsService } from '~/infrastructure/database/prisma-rls.service';
import { PrismaService } from '~/infrastructure/database/prisma.service';
import {
    UserCursor,
    UserSafe,
    userSelectAuth,
    userSelectSafe,
    UserWithPassword,
} from '~/common/types/user.types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '~/generated/prisma/enums';
import { SortDirection } from '~/common/types/sort-order.enum';

@Injectable()
export class UsersRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly prismaRls: PrismaRlsService
    ) {}

    findAll(): Promise<UserSafe[]> {
        return this.prismaRls.transaction((tx) =>
            tx.user.findMany({
                select: userSelectSafe,
            })
        );
    }

    async findAllOffset(page: number, limit: number) {
        const skip = (page - 1) * limit;

        return this.prismaRls.transaction(async (tx) => {
            const [users, total] = await Promise.all([
                tx.user.findMany({
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
                tx.user.count(),
            ]);

            return {
                data: users,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        });
    }

    async findAllCursor(cursor: UserCursor | undefined, limit: number) {
        return this.prismaRls.transaction(async (tx) => {
            const users = await tx.user.findMany({
                take: limit + 1,
                ...(cursor && {
                    skip: 1,
                    cursor: {
                        createdAt_id: cursor,
                    },
                }),
                where: {
                    isDeleted: false,
                },
                select: userSelectSafe,
                orderBy: [
                    {
                        createdAt: SortDirection.DESC,
                    },
                    {
                        id: SortDirection.DESC,
                    },
                ],
            });

            const hasNextPage = users.length > limit;
            if (hasNextPage) {
                users.pop();
            }

            const nextUser = users.at(-1);

            return {
                data: users,
                nextCursor:
                    hasNextPage && nextUser
                        ? {
                              createdAt: nextUser.createdAt,
                              id: nextUser.id,
                          }
                        : null,
                hasNextPage,
            };
        });
    }

    findById(id: string): Promise<UserSafe | null> {
        return this.prismaRls.transaction((tx) =>
            tx.user.findUnique({
                where: { id },
                select: userSelectSafe,
            })
        );
    }

    findByEmail(email: string): Promise<UserSafe | null> {
        return this.prismaRls.transaction((tx) =>
            tx.user.findUnique({
                where: { email },
                select: userSelectSafe,
            })
        );
    }

    /**
     * Auth / pre-organization context — must not use PrismaRlsService.
     * RLS session vars are not available during login.
     */
    findByEmailForAuth(email: string): Promise<UserWithPassword | null> {
        return this.prisma.user.findFirst({
            where: {
                email,
                isDeleted: false,
            },
            select: userSelectAuth,
        });
    }

    findAllAdmins(): Promise<UserSafe[]> {
        return this.prismaRls.transaction((tx) =>
            tx.user.findMany({
                where: {
                    role: UserRole.ADMIN,
                    isDeleted: false,
                },
                select: userSelectSafe,
            })
        );
    }

    create(
        dto: Omit<CreateUserDto, 'password'> & { password: string },
        role: UserRole = UserRole.USER
    ): Promise<UserSafe> {
        const { organizationId, ...userData } = dto;

        return this.prismaRls.transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    ...userData,
                    role,
                    organizations: {
                        create: {
                            organizationId,
                            role,
                        },
                    },
                },
                select: userSelectSafe,
            });

            return user;
        });
    }

    update(id: string, dto: UpdateUserDto): Promise<UserSafe> {
        const { organizationId: _organizationId, ...userData } = dto;

        return this.prismaRls.transaction((tx) =>
            tx.user.update({
                where: { id },
                data: userData,
                select: userSelectSafe,
            })
        );
    }

    restore(id: string): Promise<UserSafe> {
        return this.prismaRls.transaction((tx) =>
            tx.user.update({
                where: { id },
                data: {
                    isDeleted: false,
                },
                select: userSelectSafe,
            })
        );
    }

    softDelete(id: string): Promise<UserSafe> {
        return this.prismaRls.transaction((tx) =>
            tx.user.update({
                where: { id },
                data: {
                    isDeleted: true,
                },
                select: userSelectSafe,
            })
        );
    }
}
