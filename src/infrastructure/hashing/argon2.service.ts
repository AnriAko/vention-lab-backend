import { Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import argon2 from 'argon2';

import { argon2Config } from '~/config';
import { HashOptions } from '~/infrastructure/hashing/argon2.types';

@Injectable()
export class Argon2Service {
    constructor(
        @Inject(argon2Config.KEY)
        private readonly config: ConfigType<typeof argon2Config>
    ) {}

    private get passwordOptions(): HashOptions {
        return this.config.password;
    }

    private get tokenOptions(): HashOptions {
        return this.config.token;
    }

    hashPassword(password: string): Promise<string> {
        return argon2.hash(password, this.passwordOptions);
    }

    hashToken(token: string): Promise<string> {
        return argon2.hash(token, this.tokenOptions);
    }

    async verify(storedHash: string, value: string): Promise<boolean> {
        try {
            return await argon2.verify(storedHash, value);
        } catch {
            return false;
        }
    }
}
