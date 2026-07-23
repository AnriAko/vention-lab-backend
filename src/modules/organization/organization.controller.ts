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

import { ApiEndpoint } from '~/common/api/decorators/api-endpoint.decorator';
import { PaginationQuery } from '~/common/api/pagination/pagination.schema';
import { ApiPaginatedResponse } from '~/common/api/pagination/pagination.response';
import { ApiResponse } from '~/common/api/response/response.decorator';
import { SEED_ORGANIZATIONS } from '~/common/api/swagger/seed-examples';
import { Roles } from '~/common/security/decorators/roles.decorator';
import { SkipOrganization } from '~/common/security/decorators/skip-organization.decorator';
import { AppRole } from '~/common/security/permissions/app-role.enum';
import { AppException } from '~/common/errors/app-exception';

import { OrganizationService } from './organization.service';
import { OrganizationErrors } from './organization.errors';
import { CreateOrganizationDto } from './requests/create-organization.request.dto';
import { CreateOrganizationWithAdminDto } from './requests/create-organization-with-admin.request.dto';
import { UpdateOrganizationDto } from './requests/update-organization.request.dto';
import { OrganizationIdDto } from './requests/organization-id.request.dto';
import { OrganizationResponse } from './responses/organization.response';
import { OrganizationWithAdminResponse } from './responses/organization-with-admin.response';
import { CurrentOrganizationsResponse } from './responses/current-organizations.response';
import { UserOrganizationResponse } from './responses/user-organization.response';
import { OrganizationUserIdDto } from './requests/organization-user-id.request.dto';

@ApiTags('organizations')
@SkipOrganization()
@Roles(AppRole.OWNER)
@Controller('orgs')
export class OrganizationController {
    constructor(private readonly organizationService: OrganizationService) {}

    @Get()
    @ApiEndpoint({
        summary: 'List organizations',
        roles: [AppRole.OWNER],
        description:
            'Platform-wide offset-paginated list (no `x-organization-id`). Sorted by name ascending (BirdFans → CatFans → DogFans after seed).',
    })
    @ApiPaginatedResponse(OrganizationResponse)
    findAll(@Query() query: PaginationQuery) {
        return this.organizationService.findAll(query);
    }

    @Get('deleted')
    @ApiEndpoint({
        summary: 'List soft-deleted organizations',
        roles: [AppRole.OWNER],
        description:
            'Offset-paginated list of organizations with `isDeleted=true`.',
    })
    @ApiPaginatedResponse(OrganizationResponse)
    findAllDeleted(@Query() query: PaginationQuery) {
        return this.organizationService.findAllDeleted(query);
    }

    @Get('current')
    @Roles(AppRole.AUTHENTICATED_USER)
    @ApiEndpoint({
        summary: 'List current user organizations',
        roles: [AppRole.AUTHENTICATED_USER],
        description:
            'Returns all organizations the authenticated user belongs to, with membership role in each. Requires Bearer token only — no organization headers.',
    })
    @ApiResponse(CurrentOrganizationsResponse)
    getCurrentOrganizations() {
        return this.organizationService.getCurrentOrganizations();
    }

    @Get('users/:userId')
    @ApiEndpoint({
        summary: 'List organizations for a user',
        roles: [AppRole.OWNER],
        description:
            'Offset-paginated organizations a user belongs to, with their role in each. Platform owner only.',
    })
    @ApiPaginatedResponse(UserOrganizationResponse)
    findAllByUserId(
        @Param() params: OrganizationUserIdDto,
        @Query() query: PaginationQuery
    ) {
        return this.organizationService.findAllByUserId(params.userId, query);
    }

    @Post()
    @ApiEndpoint({
        summary:
            'Create organization with existing user who will become an admin',
        roles: [AppRole.OWNER],
        description:
            'Creates an organization and attaches an existing user as ADMIN.',
    })
    @ApiResponse(OrganizationResponse)
    create(@Body() dto: CreateOrganizationDto) {
        return this.organizationService.create(dto);
    }
    @Post('with-admin')
    @ApiEndpoint({
        summary: 'Create organization with new admin',
        roles: [AppRole.OWNER],
        description:
            'Creates an organization and a new admin user in one transaction.',
    })
    @ApiResponse(OrganizationWithAdminResponse)
    createWithAdmin(@Body() dto: CreateOrganizationWithAdminDto) {
        return this.organizationService.createWithAdmin(dto);
    }

    @Get(':id')
    @ApiEndpoint({
        summary: 'Get organization by id',
        roles: [AppRole.OWNER],
        description: `Seeded CatFans id: \`${SEED_ORGANIZATIONS.catFans.id}\`.`,
    })
    @ApiResponse(OrganizationResponse)
    async findById(@Param() dto: OrganizationIdDto) {
        const organization = await this.organizationService.findById(dto.id);
        if (!organization) {
            throw new AppException(OrganizationErrors.NOT_FOUND);
        }
        return organization;
    }

    @Patch(':id')
    @ApiEndpoint({
        summary: 'Update organization',
        roles: [AppRole.OWNER],
        description: 'Updates organization fields (e.g. name).',
    })
    @ApiResponse(OrganizationResponse)
    update(
        @Param() params: OrganizationIdDto,
        @Body() dto: UpdateOrganizationDto
    ) {
        return this.organizationService.update(params.id, dto);
    }

    @Patch(':id/restore')
    @ApiEndpoint({
        summary: 'Restore soft-deleted organization',
        roles: [AppRole.OWNER],
        description: 'Sets `isDeleted` back to false.',
    })
    @ApiResponse(OrganizationResponse)
    restore(@Param() dto: OrganizationIdDto) {
        return this.organizationService.restore(dto.id);
    }

    @Delete(':id')
    @ApiEndpoint({
        summary: 'Soft-delete organization',
        roles: [AppRole.OWNER],
        description: 'Marks the organization as deleted.',
    })
    @ApiResponse(OrganizationResponse)
    delete(@Param() dto: OrganizationIdDto) {
        return this.organizationService.delete(dto.id);
    }
}
