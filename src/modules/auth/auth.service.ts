import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import { Response } from 'express';
import ms from 'ms';

import {
    RedisService,
    RedisPrefix,
} from '~/infrastructure/cache/redis.service';
import { Argon2Service } from '~/infrastructure/hashing/argon2.service';
import { UserService } from '~/modules/user/user.service';
import { SignInDto } from '~/modules/auth/dto/sign-in.dto';

import { jwtConfig } from '~/config';
import { AuthCookie } from './auth.constants';
import { AuthRequest } from '~/common/types/auth-request.type';

@Injectable()
export class AuthService {
    private readonly accessTokenTtlSeconds: number;
    private readonly refreshTokenTtlSeconds: number;
    private readonly isProduction: boolean;

    constructor(
        private usersService: UserService,
        private jwtService: JwtService,
        private argon2Service: Argon2Service,
        private redisService: RedisService,

        @Inject(jwtConfig.KEY)
        private readonly jwtConf: ConfigType<typeof jwtConfig>
    ) {
        this.accessTokenTtlSeconds = Math.floor(
            ms(this.jwtConf.accessExpiresIn) / 1000
        );

        this.refreshTokenTtlSeconds = Math.floor(
            ms(this.jwtConf.refreshExpiresIn) / 1000
        );

        this.isProduction = process.env.NODE_ENV === 'production';
    }

    async signIn(signInDto: SignInDto, res: Response) {
        const user = await this.usersService.findByEmailForAuth(
            signInDto.email
        );

        if (!user) {
            return 'Invalid email or password';
        }

        const isValid = await this.argon2Service.verify(
            user.password,
            signInDto.password
        );

        if (!isValid) {
            return 'Invalid email or password';
        }

        const payload = {
            sub: user.id,
            role: user.role,
        };

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.jwtConf.secret,
            expiresIn: this.jwtConf.accessExpiresIn,
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.jwtConf.secret,
            expiresIn: this.jwtConf.refreshExpiresIn,
        });

        // Redis (1 user = 1 refresh token)
        await this.redisService.setWithExpiry(
            RedisPrefix.REFRESH_TOKEN,
            user.id,
            refreshToken,
            this.refreshTokenTtlSeconds
        );

        const { password: _password, ...safeUser } = user;

        res.cookie(AuthCookie.REFRESH_TOKEN, refreshToken, {
            httpOnly: true,
            secure: this.isProduction,
            sameSite: this.isProduction ? 'strict' : 'lax',
            path: '/',
            maxAge: this.refreshTokenTtlSeconds * 1000,
        });

        return {
            accessToken,
            user: safeUser,
        };
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

            res.cookie(AuthCookie.REFRESH_TOKEN, newRefreshToken, {
                httpOnly: true,
                secure: this.isProduction,
                sameSite: this.isProduction ? 'strict' : 'lax',
                path: '/',
                maxAge: this.refreshTokenTtlSeconds * 1000,
            });

            return {
                accessToken: newAccessToken,
            };
        } catch (_e) {
            return { message: 'Invalid refresh token' };
        }
    }

    async logout(req: AuthRequest, res: Response) {
        const accessToken = req.headers.authorization?.split(' ')[1];

        res.clearCookie(AuthCookie.REFRESH_TOKEN, {
            httpOnly: true,
            secure: this.isProduction,
            sameSite: this.isProduction ? 'strict' : 'lax',
            path: '/',
        });

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
