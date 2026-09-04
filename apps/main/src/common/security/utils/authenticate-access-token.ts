import type { JwtService } from '@nestjs/jwt';

import { AppException } from '~/common/errors/app-exception';
import type { AuthUser, JwtPayload } from '~/common/security/auth.types';
import { AppRole } from '~/common/security/permissions/app-role.enum';
import type { RedisService } from '~/infrastructure/cache/redis.service';
import { RedisPrefix } from '~/infrastructure/cache/redis.types';
import type { PrismaService } from '~/infrastructure/database/prisma.service';
import { AuthErrors } from '~/modules/auth/auth.errors';

export async function authenticateAccessToken(params: {
    jwtService: JwtService;
    jwtSecret: string;
    redisService: RedisService;
    prisma: PrismaService;
    token: string;
}): Promise<AuthUser> {
    const { jwtService, jwtSecret, redisService, prisma, token } = params;

    try {
        const payload = await jwtService.verifyAsync<JwtPayload>(token, {
            secret: jwtSecret,
        });

        if (!payload?.sub) {
            throw new AppException(AuthErrors.INVALID_TOKEN_PAYLOAD);
        }

        const isBlacklisted = await redisService.exists(
            RedisPrefix.INVALID_TOKEN,
            token
        );

        if (isBlacklisted) {
            throw new AppException(AuthErrors.TOKEN_REVOKED);
        }

        const owner = await prisma.owner.findUnique({
            where: { userId: payload.sub },
            select: { userId: true },
        });

        return {
            userId: payload.sub,
            role: owner ? AppRole.OWNER : AppRole.AUTHENTICATED_USER,
        };
    } catch (error) {
        if (error instanceof AppException) {
            throw error;
        }

        throw new AppException(AuthErrors.INVALID_OR_EXPIRED_TOKEN);
    }
}
