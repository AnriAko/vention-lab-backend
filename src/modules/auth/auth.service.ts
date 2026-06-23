import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Argon2Service } from '~/infrastructure/hashing/argon2.service';
import { SignInDto } from '~/modules/auth/dto/sign-in.dto';
import { UserService } from '~/modules/user/user.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UserService,
        private jwtService: JwtService,
        private argon2Service: Argon2Service
    ) {}

    async signIn(signInDto: SignInDto) {
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
        };

        const accessToken = await this.jwtService.signAsync(payload);

        const { password: _password, ...safeUser } = user;

        return {
            accessToken,
            user: safeUser,
        };
    }
}
