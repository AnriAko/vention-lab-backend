import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ApiEndpoint } from '~/common/decorators/api-endpoint.decorator';
import { ApiOrganizationHeader } from '~/common/decorators/api-organization-header.decorator';
import { Roles } from '~/common/decorators/roles.decorator';
import { OffsetPaginationQuery } from '~/common/dto/pagination.request';
import { ApiResponse } from '~/common/dto/response-schema';
import { AppRole } from '~/common/types/app-role.enum';

import { LeaderboardResponse } from './responses/leaderboard.response';
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
    @ApiResponse(LeaderboardResponse)
    getMessageLeaderboardPrisma(@Query() dto: OffsetPaginationQuery) {
        return this.userStatsService.getMessageLeaderboardPrisma(dto);
    }

    @Get('message-leaderboard/raw')
    @ApiEndpoint({
        summary: 'Message leaderboard (raw SQL)',
        roles: [AppRole.ADMIN],
        description:
            'Same leaderboard contract as the Prisma variant, implemented with raw SQL + window functions.',
    })
    @ApiResponse(LeaderboardResponse)
    getMessageLeaderboardRaw(@Query() dto: OffsetPaginationQuery) {
        return this.userStatsService.getMessageLeaderboardRaw(dto);
    }
}
