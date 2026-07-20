import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import { Response } from 'express';
import ms from 'ms';

import { AppException } from '~/common/errors';
import { RedisService } from '~/infrastructure/cache/redis.service';
import { Argon2Service } from '~/infrastructure/hashing/argon2.service';
import { AuthRepository } from '~/modules/auth/auth.repository';
import { LoginDto } from '~/modules/auth/requests/login.request.dto';
import { AuthErrors } from '~/modules/auth/auth.errors';

import { jwtConfig } from '~/config';
import { AuthCookie } from './auth.constants';
import { AuthRequest } from '~/common/types/auth.types';
import { RedisPrefix } from '~/common/types/redis.types';
import { AuthCookieService } from '~/modules/auth/auth-cookie.service';
import { LoginResponse } from '~/modules/auth/responses/login.response';

@Injectable()
export class AuthService {
    private readonly accessTokenTtlSeconds: number;
    private readonly refreshTokenTtlSeconds: number;

    constructor(
        private authRepository: AuthRepository,
        private jwtService: JwtService,
        private argon2Service: Argon2Service,
        private redisService: RedisService,
        private authCookieService: AuthCookieService,

        @Inject(jwtConfig.KEY)
        private readonly jwtConf: ConfigType<typeof jwtConfig>
    ) {
        this.accessTokenTtlSeconds = Math.floor(
            ms(this.jwtConf.accessExpiresIn) / 1000
        );

        this.refreshTokenTtlSeconds = Math.floor(
            ms(this.jwtConf.refreshExpiresIn) / 1000
        );
    }

    async login(signInDto: LoginDto, res: Response): Promise<LoginResponse> {
        const user = await this.authRepository.findByEmailForAuth(
            signInDto.email
        );

        if (!user || user.isDeleted) {
            throw new AppException(AuthErrors.INVALID_CREDENTIALS);
        }

        const isValid = await this.argon2Service.verify(
            user.password,
            signInDto.password
        );

        if (!isValid) {
            throw new AppException(AuthErrors.INVALID_CREDENTIALS);
        }

        const payload = {
            sub: user.id,
        };

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.jwtConf.secret,
            expiresIn: this.jwtConf.accessExpiresIn,
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.jwtConf.secret,
            expiresIn: this.jwtConf.refreshExpiresIn,
        });

        await this.redisService.setWithExpiry(
            RedisPrefix.REFRESH_TOKEN,
            user.id,
            refreshToken,
            this.refreshTokenTtlSeconds
        );

        this.authCookieService.setRefreshToken(
            res,
            refreshToken,
            this.refreshTokenTtlSeconds * 1000
        );
        return { accessToken };
    }

    async refresh(req: AuthRequest, res: Response) {
        const refreshToken = req.cookies?.[AuthCookie.REFRESH_TOKEN];

        if (!refreshToken) {
            return { message: 'No refresh token' };
        }

        try {
            type JwtPayload = {
                sub: string;
            };

            const payload = await this.jwtService.verifyAsync<JwtPayload>(
                refreshToken,
                {
                    secret: this.jwtConf.secret,
                }
            );

            const userId = payload.sub;

            const storedToken: string | null = await this.redisService.get(
                RedisPrefix.REFRESH_TOKEN,
                userId
            );

            if (!storedToken) {
                return { message: 'Refresh token not found' };
            }

            if (storedToken !== refreshToken) {
                return { message: 'Invalid refresh token' };
            }

            const newAccessToken = await this.jwtService.signAsync(
                { sub: userId },
                {
                    secret: this.jwtConf.secret,
                    expiresIn: this.jwtConf.accessExpiresIn,
                }
            );

            const newRefreshToken = await this.jwtService.signAsync(
                { sub: userId },
                {
                    secret: this.jwtConf.secret,
                    expiresIn: this.jwtConf.refreshExpiresIn,
                }
            );

            await this.redisService.setWithExpiry(
                RedisPrefix.REFRESH_TOKEN,
                userId,
                newRefreshToken,
                this.refreshTokenTtlSeconds
            );

            this.authCookieService.setRefreshToken(
                res,
                newRefreshToken,
                this.refreshTokenTtlSeconds * 1000
            );

            return {
                accessToken: newAccessToken,
            };
        } catch (_e) {
            return { message: 'Invalid refresh token' };
        }
    }

    async logout(req: AuthRequest, res: Response) {
        const accessToken = req.headers.authorization?.split(' ')[1];

        this.authCookieService.clearRefreshToken(res);

        if (!accessToken) {
            return { message: 'Logged out' };
        }

        const alreadyInvalid = await this.redisService.exists(
            RedisPrefix.INVALID_TOKEN,
            accessToken
        );

        if (!alreadyInvalid) {
            await this.redisService.setWithExpiry(
                RedisPrefix.INVALID_TOKEN,
                accessToken,
                '1',
                this.accessTokenTtlSeconds
            );
        }

        return { message: 'Successfully logged out' };
    }
}
