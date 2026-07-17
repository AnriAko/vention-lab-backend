import { Module } from '@nestjs/common';
import { PrismaModule } from '~/infrastructure/database/prisma.module';
import { SearchController } from '~/modules/search/search.controller';
import { SearchRepository } from '~/modules/search/search.repository';
import { SearchService } from '~/modules/search/search.service';

@Module({
    imports: [PrismaModule],
    controllers: [SearchController],
    providers: [SearchService, SearchRepository],
})
export class SearchModule {}
