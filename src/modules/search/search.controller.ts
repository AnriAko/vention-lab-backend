import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ApiEndpoint } from '~/common/api/decorators/api-endpoint.decorator';
import { ApiResponse } from '~/common/api/response/response.decorator';
import { ApiOrganizationHeader } from '~/common/security/decorators/api-organization-header.decorator';
import { Roles } from '~/common/security/decorators/roles.decorator';
import { AppRole } from '~/common/security/permissions/app-role.enum';

import { SearchDto } from './requests/search.request.dto';
import { SearchResponse } from './responses/search.response';
import { SubstringSearchResponse } from './responses/substring-search.response';
import { SearchService } from './search.service';

@ApiTags('search')
@Roles(AppRole.USER)
@ApiOrganizationHeader()
@Controller('search')
export class SearchController {
    constructor(private readonly service: SearchService) {}

    @Get('full-text')
    @ApiEndpoint({
        summary: 'Full-text search',
        roles: [AppRole.USER],
        description:
            'Full-text search across users and organizations visible in the active tenant. Try query `Cat` or `admin.catfans` after seeding.',
    })
    @ApiResponse(SearchResponse)
    search(@Query() dto: SearchDto) {
        return this.service.search(dto);
    }

    @Get('substring')
    @ApiEndpoint({
        summary: 'Substring search',
        roles: [AppRole.USER],
        description:
            'ILIKE substring search returning full user/organization response shapes. Try query `Cat` or `Demo`.',
    })
    @ApiResponse(SubstringSearchResponse)
    substring(@Query() dto: SearchDto) {
        return this.service.substringSearch(dto);
    }
}
