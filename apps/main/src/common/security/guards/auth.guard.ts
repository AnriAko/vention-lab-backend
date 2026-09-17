import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { AppException } from '~/common/errors/app-exception';
import {
    AUTH_HEADER,
    AUTH_SCHEME,
    AuthRequest,
} from '~/common/security/auth.types';
import { IS_PUBLIC_KEY } from '~/common/security/constants';
import { authenticateAccessToken } from '~/common/security/utils/authenticate-access-token';
import {
    getRequest,
    isWsContext,
} from '~/common/security/utils/execution-context';
import { setRequestUser } from '~/common/tenancy/user/user-context';
import { parseHeader } from '~/common/utils/parse-header';
import { jwtConfig } from '~/config/configuration/jwt.config';
import { RedisService } from '~/infrastructure/cache/redis.service';
import { PrismaService } from '~/infrastructure/database/prisma.service';
import { AuthErrors } from '~/modules/auth/auth.errors';

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
        if (isWsContext(context)) {
            return true;
        }

        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()]
        );

        if (isPublic) {
            return true;
        }

        const request = getRequest(context);
        const token = this.extractToken(request);

        if (!token) {
            throw new AppException(AuthErrors.MISSING_ACCESS_TOKEN);
        }

        request.user = await authenticateAccessToken({
            jwtService: this.jwtService,
            jwtSecret: this.jwtConf.secret,
            redisService: this.redisService,
            prisma: this.prisma,
            token,
        });
        setRequestUser(request.user.userId);
        return true;
    }

    private extractToken(request: AuthRequest): string | undefined {
        const parsed = parseHeader(request, AUTH_HEADER.AUTHORIZATION);

        return parsed?.type === AUTH_SCHEME.BEARER ? parsed.value : undefined;
    }
}
