import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ApiEndpoint } from '~/common/decorators/api-endpoint.decorator';
import { ApiOrganizationHeader } from '~/common/decorators/api-organization-header.decorator';
import { Roles } from '~/common/decorators/roles.decorator';
import { OffsetPaginationQuery } from '~/common/dto/pagination.request';
import { ApiResponse } from '~/common/dto/response-schema';
import { AppException } from '~/common/errors';
import { AppRole } from '~/common/types/app-role.enum';
import { SEED_USERS } from '~/common/swagger/seed-examples';

import { CreateUserDto } from './requests/create-user.request.dto';
import { UpdateUserDto } from './requests/update-user.request.dto';
import { UserIdDto } from './requests/user-id.request.dto';
import { UserListResponse } from './responses/user-list.response';
import { UserResponse } from './responses/user.response';
import { UserErrors } from './user.errors';
import { UsersService } from './user.service';

@ApiTags('users')
@Roles(AppRole.ADMIN)
@ApiOrganizationHeader()
@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) {}

    @Get()
    @ApiEndpoint({
        summary: 'List organization users',
        roles: [AppRole.ADMIN],
        description:
            'Offset-paginated members of the active organization (`x-organization-id`). Sorted by `createdAt` desc.',
    })
    @ApiResponse(UserListResponse)
    findAll(@Query() dto: OffsetPaginationQuery) {
        return this.userService.findAll(dto.page, dto.limit);
    }

    @Get('me')
    @Roles(AppRole.USER)
    @ApiEndpoint({
        summary: 'Get current user profile',
        roles: [AppRole.USER],
        description:
            'Returns safe profile fields for the authenticated user in the active organization.',
    })
    @ApiResponse(UserResponse)
    async getCurrentProfile() {
        const user = await this.userService.getCurrentProfile();
        if (!user) {
            throw new AppException(UserErrors.NOT_FOUND);
        }
        return user;
    }

    @Get(':id')
    @ApiEndpoint({
        summary: 'Get user by id',
        roles: [AppRole.ADMIN],
        description: `Returns a member of the active organization. Seeded demo member id: \`${SEED_USERS.demoMember.id}\`.`,
    })
    @ApiResponse(UserResponse)
    async findById(@Param() dto: UserIdDto) {
        const user = await this.userService.findById(dto.id);
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
        description: 'Partial update of an organization member.',
    })
    @ApiResponse(UserResponse)
    update(@Param() params: UserIdDto, @Body() dto: UpdateUserDto) {
        return this.userService.update(params.id, dto);
    }

    @Patch(':id/restore')
    @ApiEndpoint({
        summary: 'Restore soft-deleted user',
        roles: [AppRole.ADMIN],
        description: 'Sets `isDeleted` back to false for the user.',
    })
    @ApiResponse(UserResponse)
    restore(@Param() dto: UserIdDto) {
        return this.userService.restore(dto.id);
    }

    @Delete(':id')
    @ApiEndpoint({
        summary: 'Soft-delete user',
        roles: [AppRole.ADMIN],
        description:
            'Soft-deletes the user and clears their refresh token from Redis.',
    })
    @ApiResponse(UserResponse)
    delete(@Param() dto: UserIdDto) {
        return this.userService.delete(dto.id);
    }
}
