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
import { SEED_ORGANIZATIONS } from '~/common/swagger/seed-examples';

import { OrganizationMemberService } from './organization-member.service';
import { OrganizationIdParamDto } from './requests/organization-id-param.request.dto';
import { OrganizationMemberParamsDto } from './requests/member-id.request.dto';
import { UpdateMemberRoleDto } from './requests/update-member-role.request.dto';
import { OrganizationMemberListResponse } from './responses/organization-member-list.response';
import { OrganizationMemberResponse } from './responses/organization-member.response';

@ApiTags('organization-members')
@Roles(AppRole.ADMIN)
@ApiOrganizationHeader()
@Controller('organizations/:organizationId/members')
export class OrganizationMemberController {
    constructor(
        private readonly organizationMemberService: OrganizationMemberService
    ) {}

    @Get()
    @ApiEndpoint({
        summary: 'List organization members',
        roles: [AppRole.ADMIN],
        description: `Offset-paginated members for \`:organizationId\` (seeded CatFans: \`${SEED_ORGANIZATIONS.catFans.id}\`). Sorted by name.`,
    })
    @ApiResponse(OrganizationMemberListResponse)
    findAll(
        @Param() params: OrganizationIdParamDto,
        @Query() dto: OffsetPaginationQuery
    ) {
        return this.organizationMemberService.findAll(
            params.organizationId,
            dto.page,
            dto.limit
        );
    }

    @Get('deleted')
    @ApiEndpoint({
        summary: 'List soft-deleted members',
        roles: [AppRole.ADMIN],
        description:
            'Offset-paginated soft-deleted users that still have membership in the organization.',
    })
    @ApiResponse(OrganizationMemberListResponse)
    findAllDeleted(
        @Param() params: OrganizationIdParamDto,
        @Query() dto: OffsetPaginationQuery
    ) {
        return this.organizationMemberService.findAllDeleted(
            params.organizationId,
            dto.page,
            dto.limit
        );
    }

    @Get('admins')
    @ApiEndpoint({
        summary: 'List organization admins',
        roles: [AppRole.ADMIN],
        description:
            'Offset-paginated members with `ADMIN` role in the organization. Sorted by name.',
    })
    @ApiResponse(OrganizationMemberListResponse)
    findAllAdmins(
        @Param() params: OrganizationIdParamDto,
        @Query() dto: OffsetPaginationQuery
    ) {
        return this.organizationMemberService.findAllAdmins(
            params.organizationId,
            dto.page,
            dto.limit
        );
    }

    @Patch(':userId/role')
    @ApiEndpoint({
        summary: 'Assign member role',
        roles: [AppRole.ADMIN],
        description:
            'Upserts membership and sets organization role (`USER` or `ADMIN`).',
    })
    @ApiResponse(OrganizationMemberResponse)
    assignRole(
        @Param() params: OrganizationMemberParamsDto,
        @Body() dto: UpdateMemberRoleDto
    ) {
        return this.organizationMemberService.assignRole(
            params.organizationId,
            params.userId,
            dto
        );
    }

    @Delete(':userId')
    @ApiEndpoint({
        summary: 'Remove member from organization',
        roles: [AppRole.ADMIN],
        description:
            'Removes membership (and role) for the user in the organization.',
    })
    @ApiResponse(EmptyResponse)
    remove(@Param() params: OrganizationMemberParamsDto) {
        return this.organizationMemberService.remove(
            params.organizationId,
            params.userId
        );
    }
}
