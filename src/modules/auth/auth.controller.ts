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
import { SkipOrganization } from '~/common/decorators/skip-organization.decorator';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}
    @PublicRoute()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    signIn(
        @Body() signInDto: SignInDto,
        @Res({ passthrough: true }) res: Response
    ) {
        return this.authService.signIn(signInDto, res);
    }

    @SkipOrganization()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    refresh(
        @Req() req: AuthRequest,
        @Res({ passthrough: true }) res: Response
    ) {
        return this.authService.refresh(req, res);
    }

    @SkipOrganization()
    @Delete('logout')
    @HttpCode(HttpStatus.OK)
    logout(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
        return this.authService.logout(req, res);
    }
}
