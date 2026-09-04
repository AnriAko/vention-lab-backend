import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { CookieOptions } from 'express';
import { AuthCookie } from './auth.constants';

@Injectable()
export class AuthCookieService {
    constructor(private readonly configService: ConfigService) {}

    private isProduction(): boolean {
        return this.configService.get<string>('NODE_ENV') === 'production';
    }

    private baseOptions(): CookieOptions {
        const isProd = this.isProduction();

        return {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'strict' : 'lax',
            path: '/',
        };
    }

    setRefreshToken(res: Response, token: string, maxAgeMs: number) {
        res.cookie(AuthCookie.REFRESH_TOKEN, token, {
            ...this.baseOptions(),
            maxAge: maxAgeMs,
        });
    }

    clearRefreshToken(res: Response) {
        res.clearCookie(AuthCookie.REFRESH_TOKEN, {
            ...this.baseOptions(),
        });
    }
}
