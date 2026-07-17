import { Controller, Get, Query } from '@nestjs/common';
import { PublicRoute } from '~/common/decorators/public.decorator';
import { SearchDto } from '~/modules/search/dto/search.dto';
import { SearchService } from '~/modules/search/search.service';

@PublicRoute()
@Controller('search')
export class SearchController {
    constructor(private readonly service: SearchService) {}

    @Get('full-text')
    search(@Query() dto: SearchDto) {
        return this.service.search(dto);
    }

    @Get('substring')
    substring(@Query() dto: SearchDto) {
        return this.service.substringSearch(dto);
    }
}
