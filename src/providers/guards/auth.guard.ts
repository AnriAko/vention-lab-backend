import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import {
    RedisService,
    RedisPrefix,
} from '~/infrastructure/cache/redis.service';

import { jwtConfig } from '~/config';
import { IS_PUBLIC_KEY } from '~/common/decorators/public.decorator';
import { AuthRequest } from '~/common/types/auth-request.type';

type JwtPayload = {
    sub: string;
    role: 'user' | 'admin';
};

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

        const token = this.extractTokenFromHeader(request);

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

            return true;
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];

        return type === 'Bearer' ? token : undefined;
    }
}
