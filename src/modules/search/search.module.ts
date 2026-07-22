import { Module } from '@nestjs/common';
import { PrismaModule } from '~/infrastructure/database';
import { SearchController } from './search.controller';
import { SearchRepository } from './search.repository';
import { SearchService } from './search.service';

@Module({
    imports: [PrismaModule],
    controllers: [SearchController],
    providers: [SearchService, SearchRepository],
})
export class SearchModule {}
