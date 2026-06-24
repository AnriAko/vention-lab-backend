import { registerAs } from '@nestjs/config';
import { ConfigKeys } from '~/config/config.keys';
import type { JwtConfig } from '~/config/env.schema';

export const jwtConfig = registerAs(
    ConfigKeys.JWT,
    (): JwtConfig => ({
        secret: process.env.JWT_SECRET!,
        accessExpiresIn: process.env
            .JWT_ACCESS_EXPIRES_IN! as JwtConfig['accessExpiresIn'],
        refreshExpiresIn: process.env
            .JWT_REFRESH_EXPIRES_IN! as JwtConfig['refreshExpiresIn'],
    })
);
