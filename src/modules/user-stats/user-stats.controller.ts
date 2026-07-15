import { Controller, Get, Query } from '@nestjs/common';
import { UserStatsService } from './user-stats.service';
import { OffsetPaginationDto } from '~/common/dto/offset-pagination.dto';
import { Roles } from '~/common/decorators/roles.decorator';
import { UserRole } from '~/generated/prisma/enums';

@Roles(UserRole.ADMIN)
@Controller('user-stats')
export class UserStatsController {
    constructor(private readonly userStatsService: UserStatsService) {}

    @Get('message-leaderboard/prisma')
    getMessageLeaderboardPrisma(@Query() dto: OffsetPaginationDto) {
        return this.userStatsService.getMessageLeaderboardPrisma(dto);
    }

    @Get('message-leaderboard/raw')
    getMessageLeaderboardRaw(@Query() dto: OffsetPaginationDto) {
        return this.userStatsService.getMessageLeaderboardRaw(dto);
    }
}
