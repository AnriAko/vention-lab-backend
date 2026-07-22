import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import {
    ApiEndpoint,
    EmptyResponse,
    PaginationQuery,
    ApiPaginatedResponse,
    ApiResponse,
    SEED_USERS,
} from '~/common/api';
import { ApiOrganizationHeader, Roles, AppRole } from '~/common/security';
import { AppException } from '~/common/errors';

import { MemberService } from './member.service';
import { MemberErrors } from './member.errors';
import { memberParamsDto } from './requests/member-id.request.dto';
import { UpdateMemberRoleDto } from './requests/update-member-role.request.dto';
import { MemberResponse } from './responses/organization-member.response';

@ApiTags('members')
@Roles(AppRole.ADMIN)
@ApiOrganizationHeader()
@Controller('members')
export class MemberController {
    constructor(private readonly memberService: MemberService) {}

    @Get()
    @ApiEndpoint({
        summary: 'List members',
        roles: [AppRole.ADMIN],
        description:
            'Offset-paginated active members of the organization (`x-organization-id`). Sorted by name.',
    })
    @ApiPaginatedResponse(MemberResponse)
    findAll(@Query() query: PaginationQuery) {
        return this.memberService.findAll(query);
    }

    @Get('deleted')
    @ApiEndpoint({
        summary: 'List soft-deleted members',
        roles: [AppRole.ADMIN],
        description:
            'Offset-paginated members soft-removed from the active organization (`x-organization-id`). Membership is kept for restore.',
    })
    @ApiPaginatedResponse(MemberResponse)
    findAllDeleted(@Query() query: PaginationQuery) {
        return this.memberService.findAllDeleted(query);
    }

    @Get('admins')
    @ApiEndpoint({
        summary: 'List organization admins',
        roles: [AppRole.ADMIN],
        description:
            'Offset-paginated active members with `ADMIN` role in the organization (`x-organization-id`). Sorted by name.',
    })
    @ApiPaginatedResponse(MemberResponse)
    findAllAdmins(@Query() query: PaginationQuery) {
        return this.memberService.findAllAdmins(query);
    }

    @Get(':userId')
    @ApiEndpoint({
        summary: 'Get member by id',
        roles: [AppRole.ADMIN],
        description: `Returns an active member of the organization. Seeded demo member id: \`${SEED_USERS.demoMember.id}\`.`,
    })
    @ApiResponse(MemberResponse)
    async findById(@Param() params: memberParamsDto) {
        const member = await this.memberService.findById(params.userId);
        if (!member) {
            throw new AppException(MemberErrors.NOT_FOUND);
        }
        return member;
    }

    @Patch(':userId/role')
    @ApiEndpoint({
        summary: 'Assign member role',
        roles: [AppRole.ADMIN],
        description: `Upserts membership and sets organization role (\`USER\` or \`ADMIN\`) for an active member. Seeded demo member id: \`${SEED_USERS.demoMember.id}\`.`,
    })
    @ApiResponse(MemberResponse)
    assignRole(
        @Param() params: memberParamsDto,
        @Body() dto: UpdateMemberRoleDto
    ) {
        return this.memberService.assignRole(params.userId, dto);
    }

    @Patch(':userId/restore')
    @ApiEndpoint({
        summary: 'Restore soft-deleted member',
        roles: [AppRole.ADMIN],
        description:
            'Restores a soft-removed membership in the active organization. Previous role is preserved.',
    })
    @ApiResponse(MemberResponse)
    restore(@Param() params: memberParamsDto) {
        return this.memberService.restore(params.userId);
    }

    @Delete(':userId')
    @ApiEndpoint({
        summary: 'Soft-remove member from organization',
        roles: [AppRole.ADMIN],
        description:
            'Soft-removes the user from the active organization (`x-organization-id`). Access to other organizations is unchanged. Role is preserved for restore.',
    })
    @ApiResponse(EmptyResponse)
    remove(@Param() params: memberParamsDto) {
        return this.memberService.remove(params.userId);
    }
}
