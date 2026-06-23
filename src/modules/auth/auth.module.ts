import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';

import { ConfigModule, ConfigType } from '@nestjs/config';
import { jwtConfig } from '~/config';

import { Argon2Module } from '~/infrastructure/hashing/argon2.module';
import { UserModule } from '~/modules/user/user.module';

import { AuthController } from '~/modules/auth/auth.controller';
import { AuthService } from '~/modules/auth/auth.service';

@Module({
    imports: [
        UserModule,
        Argon2Module,

        NestJwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [jwtConfig.KEY],

            useFactory: (config: ConfigType<typeof jwtConfig>) => ({
                secret: config.secret,
                signOptions: {
                    expiresIn: config.accessExpiresIn,
                },
            }),
        }),
    ],

    controllers: [AuthController],
    providers: [AuthService],
})
export class AuthModule {}
