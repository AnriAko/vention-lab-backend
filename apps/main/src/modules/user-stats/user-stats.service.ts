import { Injectable } from '@nestjs/common';
import type { Pagination } from '~/common/api/pagination/pagination.schema';
import { UserStatsRepository } from './user-stats.repository';

@Injectable()
export class UserStatsService {
    constructor(private readonly userStatsRepository: UserStatsRepository) {}

    getMessageLeaderboardPrisma(pagination: Pagination) {
        return this.userStatsRepository.getMessageLeaderboardPrisma(pagination);
    }

    getMessageLeaderboardRaw(pagination: Pagination) {
        return this.userStatsRepository.getMessageLeaderboardRaw(pagination);
    }
}
