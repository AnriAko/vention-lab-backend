import {
    Body,
    Controller,
    Delete,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { AuthService } from '~/modules/auth/auth.service';
import { SignInDto } from '~/modules/auth/dto/sign-in.dto';
import type { AuthRequest } from '~/common/types/auth.types';
import { PublicRoute } from '~/common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}
    @PublicRoute()
    @Post('sign-in')
    @HttpCode(HttpStatus.OK)
    signIn(
        @Body() signInDto: SignInDto,
        @Res({ passthrough: true }) res: Response
    ) {
        return this.authService.signIn(signInDto, res);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    refresh(
        @Req() req: AuthRequest,
        @Res({ passthrough: true }) res: Response
    ) {
        return this.authService.refresh(req, res);
    }

    @Delete('logout')
    @HttpCode(HttpStatus.OK)
    logout(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
        return this.authService.logout(req, res);
    }
}
