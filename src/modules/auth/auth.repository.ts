import { Injectable } from '@nestjs/common';

import { PrismaService } from '~/infrastructure/database/prisma.service';
import {
    userSelectAuth,
    UserWithPassword,
} from '~/common/types/auth.types';

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

        return user;
    }
}
