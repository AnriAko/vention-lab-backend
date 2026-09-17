import { Inject, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { AppException } from '~/common/errors/app-exception';
import type { AuthUser } from '~/common/security/auth.types';
import { IS_PUBLIC_KEY } from '~/common/security/constants';
import { authenticateAccessToken } from '~/common/security/utils/authenticate-access-token';
import { getWsClient } from '~/common/security/utils/execution-context';
import {
    extractWsAccessToken,
    setWsClientUser,
} from '~/common/security/utils/ws-handshake';
import type { WsHandshakeClient } from '~/common/security/ws-client.types';
import { jwtConfig } from '~/config/configuration/jwt.config';
import { RedisService } from '~/infrastructure/cache/redis.service';
import { PrismaService } from '~/infrastructure/database/prisma.service';
import { AuthErrors } from '~/modules/auth/auth.errors';

@Injectable()
export class WsAuthGuard implements CanActivate {
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

        await this.authenticate(getWsClient(context));
        return true;
    }

    async authenticate(client: WsHandshakeClient): Promise<AuthUser> {
        const token = extractWsAccessToken(client);

        if (!token) {
            throw new AppException(AuthErrors.MISSING_ACCESS_TOKEN);
        }

        const user = await authenticateAccessToken({
            jwtService: this.jwtService,
            jwtSecret: this.jwtConf.secret,
            redisService: this.redisService,
            prisma: this.prisma,
            token,
        });

        setWsClientUser(client, user);
        return user;
    }
}
