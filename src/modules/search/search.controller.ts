import { Controller, Get, Query } from '@nestjs/common';
import { SearchDto } from '~/modules/search/dto/search.dto';
import { SearchService } from '~/modules/search/search.service';

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
