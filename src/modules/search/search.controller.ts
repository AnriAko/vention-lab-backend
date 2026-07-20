import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ApiEndpoint } from '~/common/decorators/api-endpoint.decorator';
import { ApiOrganizationHeader } from '~/common/decorators/api-organization-header.decorator';
import { Roles } from '~/common/decorators/roles.decorator';
import { ApiResponse } from '~/common/dto/response-schema';
import { AppRole } from '~/common/types/app-role.enum';

import { SearchDto } from '~/modules/search/requests/search.request.dto';
import { SearchResponse } from '~/modules/search/responses/search.response';
import { SubstringSearchResponse } from '~/modules/search/responses/substring-search.response';
import { SearchService } from '~/modules/search/search.service';

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
