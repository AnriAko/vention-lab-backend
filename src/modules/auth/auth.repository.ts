import { Injectable } from '@nestjs/common';

import { PrismaService } from '~/infrastructure/database/prisma.service';
import { AppRole } from '~/common/types/app-role.enum';
import { userSelectAuth, UserWithPassword } from '~/common/types/auth.types';

@Injectable()
export class AuthRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByEmailForAuth(email: string): Promise<UserWithPassword | null> {
        const user = await this.prisma.user.findUnique({
            where: {
                email,
                isDeleted: false,
            },
            select: userSelectAuth,
        });

        if (!user) {
            return null;
        }

        const owner = await this.prisma.owner.findUnique({
            where: { userId: user.id },
            select: { userId: true },
        });

        return {
            ...user,
            role: owner ? AppRole.OWNER : AppRole.USER,
        };
    }
}
