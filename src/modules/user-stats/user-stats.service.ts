import { Injectable } from '@nestjs/common';
import { UserStatsRepository } from './user-stats.repository';
import { OffsetPaginationDto } from '~/common/dto/offset-pagination.dto';

@Injectable()
export class UserStatsService {
    constructor(private readonly userStatsRepository: UserStatsRepository) {}

    async getMessageLeaderboardPrisma(dto: OffsetPaginationDto) {
        return this.userStatsRepository.getMessageLeaderboardPrisma(dto);
    }

    async getMessageLeaderboardRaw(dto: OffsetPaginationDto) {
        return this.userStatsRepository.getMessageLeaderboardRaw(dto);
    }
}
