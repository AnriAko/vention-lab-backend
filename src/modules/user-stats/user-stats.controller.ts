import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import {
    ApiEndpoint,
    PaginationQuery,
    ApiPaginatedResponse,
} from '~/common/api';
import { ApiOrganizationHeader, Roles, AppRole } from '~/common/security';

import { LeaderboardEntryResponse } from './responses/leaderboard.response';
import { UserStatsService } from './user-stats.service';

@ApiTags('user-stats')
@Roles(AppRole.ADMIN)
@ApiOrganizationHeader()
@Controller('user-stats')
export class UserStatsController {
    constructor(private readonly userStatsService: UserStatsService) {}

    @Get('message-leaderboard/prisma')
    @ApiEndpoint({
        summary: 'Message leaderboard (Prisma)',
        roles: [AppRole.ADMIN],
        description:
            'Offset-paginated leaderboard ranked by message count. After seed, demo member and CatFans admin are boosted near the top.',
    })
    @ApiPaginatedResponse(LeaderboardEntryResponse)
    getMessageLeaderboardPrisma(@Query() query: PaginationQuery) {
        return this.userStatsService.getMessageLeaderboardPrisma(query);
    }

    @Get('message-leaderboard/raw')
    @ApiEndpoint({
        summary: 'Message leaderboard (raw SQL)',
        roles: [AppRole.ADMIN],
        description:
            'Same leaderboard contract as the Prisma variant, implemented with raw SQL + window functions.',
    })
    @ApiPaginatedResponse(LeaderboardEntryResponse)
    getMessageLeaderboardRaw(@Query() query: PaginationQuery) {
        return this.userStatsService.getMessageLeaderboardRaw(query);
    }
}
