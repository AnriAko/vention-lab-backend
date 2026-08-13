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
import { ApiBody, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ApiEndpoint } from '~/common/api/decorators/api-endpoint.decorator';
import { MessageResponse } from '~/common/api/dto/message.response';
import { TokenResponse } from '~/common/api/dto/token.response';
import { ApiResponse } from '~/common/api/response/response.decorator';
import {
    SEED_LOGIN_ORG_ADMIN,
    SEED_LOGIN_OWNER,
} from '~/common/api/swagger/seed-examples';
import { SWAGGER_AUTH } from '~/common/api/swagger/swagger.constants';
import { PublicRoute } from '~/common/security/decorators/public.decorator';
import { SkipOrganization } from '~/common/security/decorators/skip-organization.decorator';
import type { AuthRequest } from '~/common/security/auth.types';
import { AuthService } from './auth.service';
import { LoginDto } from './requests/login.request.dto';
import { LoginResponse } from './responses/login.response';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @PublicRoute()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiEndpoint({
        summary: 'Login',
        guest: true,
        description:
            'Authenticate with email/password. Returns `accessToken` and sets httpOnly `refresh_token` cookie. Use seeded accounts from the API description.',
    })
    @ApiBody({
        type: LoginDto,
        examples: {
            owner: {
                summary: 'Platform owner',
                value: SEED_LOGIN_OWNER,
            },
            orgAdmin: {
                summary: 'CatFans admin',
                value: SEED_LOGIN_ORG_ADMIN,
            },
        },
    })
    @ApiResponse(LoginResponse)
    login(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) res: Response
    ): Promise<LoginResponse> {
        return this.authService.login(loginDto, res);
    }

    @SkipOrganization()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiEndpoint({
        summary: 'Refresh access token',
        description:
            'Issues a new access token using the httpOnly refresh cookie. Requires a valid Bearer access token (guard) plus `refresh_token` cookie from login.',
    })
    @ApiCookieAuth(SWAGGER_AUTH.REFRESH_TOKEN)
    @ApiResponse(TokenResponse)
    refresh(
        @Req() req: AuthRequest,
        @Res({ passthrough: true }) res: Response
    ) {
        return this.authService.refresh(req, res);
    }

    @SkipOrganization()
    @Delete('logout')
    @HttpCode(HttpStatus.OK)
    @ApiEndpoint({
        summary: 'Logout',
        description:
            'Clears the refresh cookie and blacklists the current access token in Redis.',
    })
    @ApiResponse(MessageResponse)
    logout(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
        return this.authService.logout(req, res);
    }
}
