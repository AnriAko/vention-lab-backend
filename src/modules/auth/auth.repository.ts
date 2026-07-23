import { Injectable } from '@nestjs/common';

import { PrismaService } from '~/infrastructure/database/prisma.service';
import { userSelectAuth } from '~/common/security/auth.types';
import type { UserWithPassword } from '~/common/security/auth.types';

@Injectable()
export class AuthRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByEmailForAuth(email: string): Promise<UserWithPassword | null> {
        const user = await this.prisma.user.findUnique({
            where: {
                email,
            },
            select: userSelectAuth,
        });

        if (!user) {
            return null;
        }

        return user;
    }
}
