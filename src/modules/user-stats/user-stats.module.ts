import { Module } from '@nestjs/common';
import { UserStatsController } from './user-stats.controller';
import { UserStatsService } from './user-stats.service';
import { UserStatsRepository } from './user-stats.repository';
import { PrismaModule } from '~/infrastructure/database';

@Module({
    imports: [PrismaModule],
    controllers: [UserStatsController],
    providers: [UserStatsService, UserStatsRepository],
    exports: [UserStatsService],
})
export class UserStatsModule {}
