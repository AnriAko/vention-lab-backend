import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { AppException } from '~/common/errors/app-exception';
import { RedisService } from '~/infrastructure/cache/redis.service';
import { RedisPrefix } from '~/infrastructure/cache/redis.types';
import { PrismaService } from '~/infrastructure/database/prisma.service';
import { AuthErrors } from '~/modules/auth/auth.errors';

import { jwtConfig } from '~/config/configuration/jwt.config';
import {
    AUTH_HEADER,
    AUTH_SCHEME,
    AuthRequest,
    JwtPayload,
} from '~/common/security/auth.types';
import { AppRole } from '~/common/security/permissions/app-role.enum';
import { IS_PUBLIC_KEY } from '~/common/security/constants';
import { parseHeader } from '~/common/utils/parse-header';
import { setRequestUser } from '~/common/tenancy/user/user-context';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly redisService: RedisService,
        private readonly prisma: PrismaService,
        private readonly reflector: Reflector,

        @Inject(jwtConfig.KEY)
        private readonly jwtConf: ConfigType<typeof jwtConfig>
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()]
        );

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest<AuthRequest>();

        const token = this.extractToken(request);

        if (!token) {
            throw new AppException(AuthErrors.MISSING_ACCESS_TOKEN);
        }

        try {
            const payload = await this.jwtService.verifyAsync<JwtPayload>(
                token,
                {
                    secret: this.jwtConf.secret,
                }
            );

            if (!payload?.sub) {
                throw new AppException(AuthErrors.INVALID_TOKEN_PAYLOAD);
            }

            const isBlacklisted = await this.redisService.exists(
                RedisPrefix.INVALID_TOKEN,
                token
            );

            if (isBlacklisted) {
                throw new AppException(AuthErrors.TOKEN_REVOKED);
            }

            const owner = await this.prisma.owner.findUnique({
                where: { userId: payload.sub },
                select: { userId: true },
            });

            request.user = {
                userId: payload.sub,
                role: owner ? AppRole.OWNER : AppRole.AUTHENTICATED_USER,
            };
            setRequestUser(payload.sub);
            return true;
        } catch (error) {
            if (error instanceof AppException) {
                throw error;
            }

            throw new AppException(AuthErrors.INVALID_OR_EXPIRED_TOKEN);
        }
    }
    private extractToken(request: AuthRequest): string | undefined {
        const parsed = parseHeader(request, AUTH_HEADER.AUTHORIZATION);

        return parsed?.type === AUTH_SCHEME.BEARER ? parsed.value : undefined;
    }
}
