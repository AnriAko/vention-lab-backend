import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ApiEndpoint, ApiResponse } from '~/common/api';
import {
    ApiOrganizationHeader,
    Roles,
    SkipOrganization,
    AppRole,
} from '~/common/security';
import { AppException } from '~/common/errors';

import { CreateUserDto } from './requests/create-user.request.dto';
import { UpdateUserDto } from './requests/update-user.request.dto';
import { UserIdDto } from './requests/user-id.request.dto';
import { CurrentUserResponse } from './responses/current-user.response';
import { UserResponse } from './responses/user.response';
import { UserErrors } from './user.errors';
import { UsersService } from './user.service';

@ApiTags('users')
@Roles(AppRole.ADMIN)
@ApiOrganizationHeader()
@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) {}

    @SkipOrganization()
    @Get('current')
    @Roles(AppRole.AUTHENTICATED_USER)
    @ApiEndpoint({
        summary: 'Get current authenticated user',
        roles: [AppRole.AUTHENTICATED_USER],
        description:
            'Returns the authenticated user profile. Requires Bearer token only — no organization header or organization role.',
    })
    @ApiResponse(CurrentUserResponse)
    async getCurrentUser() {
        const user = await this.userService.getCurrentUser();
        if (!user) {
            throw new AppException(UserErrors.NOT_FOUND);
        }
        return user;
    }

    @Post()
    @ApiEndpoint({
        summary: 'Create user',
        roles: [AppRole.ADMIN],
        description:
            'Creates a user and attaches them to the given organization with membership role USER.',
    })
    @ApiResponse(UserResponse)
    create(@Body() dto: CreateUserDto) {
        return this.userService.createUser(dto);
    }

    @Patch(':id')
    @ApiEndpoint({
        summary: 'Update user',
        roles: [AppRole.ADMIN],
        description: 'Partial update of an organization member profile.',
    })
    @ApiResponse(UserResponse)
    update(@Param() params: UserIdDto, @Body() dto: UpdateUserDto) {
        return this.userService.update(params.id, dto);
    }
}
