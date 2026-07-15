import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { RedisService } from '~/infrastructure/cache/redis.service';
import { setRequestUser } from '~/infrastructure/context/request-context';

import { jwtConfig } from '~/config';
import {
    AUTH_HEADER,
    AUTH_SCHEME,
    AuthRequest,
    JwtPayload,
} from '~/common/types/auth.types';
import { IS_PUBLIC_KEY } from '~/common/decorators/constants';
import { RedisPrefix } from '~/common/types/redis.types';
import { parseHeader } from '~/common/utils/parse-header';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly redisService: RedisService,
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
            throw new UnauthorizedException('Missing access token');
        }

        try {
            const payload = await this.jwtService.verifyAsync<JwtPayload>(
                token,
                {
                    secret: this.jwtConf.secret,
                }
            );

            if (!payload?.sub) {
                throw new UnauthorizedException('Invalid token payload');
            }

            const isBlacklisted = await this.redisService.exists(
                RedisPrefix.INVALID_TOKEN,
                token
            );

            if (isBlacklisted) {
                throw new UnauthorizedException('Token revoked');
            }

            request.user = {
                userId: payload.sub,
                role: payload.role,
            };
            setRequestUser(payload.sub);
            return true;
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
    private extractToken(request: AuthRequest): string | undefined {
        const parsed = parseHeader(request, AUTH_HEADER.AUTHORIZATION);

        return parsed?.type === AUTH_SCHEME.BEARER ? parsed.value : undefined;
    }
}
