import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from '~/modules/auth/auth.service';
import { SignInDto } from '~/modules/auth/dto/sign-in.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('sign-in')
    @HttpCode(HttpStatus.OK)
    signIn(@Body() signInDto: SignInDto) {
        return this.authService.signIn(signInDto);
    }
}
