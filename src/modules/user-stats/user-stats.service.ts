import { Injectable } from '@nestjs/common';
import { UserStatsRepository } from './user-stats.repository';
import { OffsetPagination } from '~/common/dto/pagination.request';

@Injectable()
export class UserStatsService {
    constructor(private readonly userStatsRepository: UserStatsRepository) {}

    async getMessageLeaderboardPrisma(dto: OffsetPagination) {
        return this.userStatsRepository.getMessageLeaderboardPrisma(dto);
    }

    async getMessageLeaderboardRaw(dto: OffsetPagination) {
        return this.userStatsRepository.getMessageLeaderboardRaw(dto);
    }
}
