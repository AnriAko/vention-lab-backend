import { Injectable } from '@nestjs/common';

import { PrismaService } from '~/infrastructure/database';
import { userSelectAuth, UserWithPassword } from '~/common/security';

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
