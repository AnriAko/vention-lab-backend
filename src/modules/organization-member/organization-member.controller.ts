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

import { ApiEndpoint } from '~/common/decorators/api-endpoint.decorator';
import { ApiOrganizationHeader } from '~/common/decorators/api-organization-header.decorator';
import { Roles } from '~/common/decorators/roles.decorator';
import { EmptyResponse } from '~/common/dto/empty.response';
import { OffsetPaginationQuery } from '~/common/dto/pagination.request';
import { ApiResponse } from '~/common/dto/response-schema';
import { AppRole } from '~/common/types/app-role.enum';
import { SEED_USERS } from '~/common/swagger/seed-examples';

import { OrganizationMemberService } from './organization-member.service';
import { OrganizationMemberParamsDto } from './requests/member-id.request.dto';
import { UpdateMemberRoleDto } from './requests/update-member-role.request.dto';
import { OrganizationMemberListResponse } from './responses/organization-member-list.response';
import { OrganizationMemberResponse } from './responses/organization-member.response';

@ApiTags('members')
@Roles(AppRole.ADMIN)
@ApiOrganizationHeader()
@Controller('members')
export class OrganizationMemberController {
    constructor(
        private readonly organizationMemberService: OrganizationMemberService
    ) {}

    @Get()
    @ApiEndpoint({
        summary: 'List organization members',
        roles: [AppRole.ADMIN],
        description:
            'Offset-paginated members of the active organization (`x-organization-id`). Sorted by name.',
    })
    @ApiResponse(OrganizationMemberListResponse)
    findAll(@Query() dto: OffsetPaginationQuery) {
        return this.organizationMemberService.findAll(dto.page, dto.limit);
    }

    @Get('deleted')
    @ApiEndpoint({
        summary: 'List soft-deleted members',
        roles: [AppRole.ADMIN],
        description:
            'Offset-paginated soft-deleted users that still have membership in the active organization (`x-organization-id`).',
    })
    @ApiResponse(OrganizationMemberListResponse)
    findAllDeleted(@Query() dto: OffsetPaginationQuery) {
        return this.organizationMemberService.findAllDeleted(
            dto.page,
            dto.limit
        );
    }

    @Get('admins')
    @ApiEndpoint({
        summary: 'List organization admins',
        roles: [AppRole.ADMIN],
        description:
            'Offset-paginated members with `ADMIN` role in the active organization (`x-organization-id`). Sorted by name.',
    })
    @ApiResponse(OrganizationMemberListResponse)
    findAllAdmins(@Query() dto: OffsetPaginationQuery) {
        return this.organizationMemberService.findAllAdmins(
            dto.page,
            dto.limit
        );
    }

    @Patch(':userId/role')
    @ApiEndpoint({
        summary: 'Assign member role',
        roles: [AppRole.ADMIN],
        description: `Upserts membership and sets organization role (\`USER\` or \`ADMIN\`) for the user in the active organization. Seeded demo member id: \`${SEED_USERS.demoMember.id}\`.`,
    })
    @ApiResponse(OrganizationMemberResponse)
    assignRole(
        @Param() params: OrganizationMemberParamsDto,
        @Body() dto: UpdateMemberRoleDto
    ) {
        return this.organizationMemberService.assignRole(params.userId, dto);
    }

    @Delete(':userId')
    @ApiEndpoint({
        summary: 'Remove member from organization',
        roles: [AppRole.ADMIN],
        description:
            'Removes membership (and role) for the user in the active organization (`x-organization-id`).',
    })
    @ApiResponse(EmptyResponse)
    remove(@Param() params: OrganizationMemberParamsDto) {
        return this.organizationMemberService.remove(params.userId);
    }
}
