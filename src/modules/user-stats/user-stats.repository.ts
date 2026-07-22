import { Injectable } from '@nestjs/common';
import type { Pagination, PaginatedResult } from '~/common/api';
import { PrismaRlsClient } from '~/common/tenancy';
import { messageLeaderboardQuery } from './user-stats.queries';
import type { LeaderboardEntryResponse } from './responses/leaderboard.response';

@Injectable()
export class UserStatsRepository {
    constructor(private readonly prisma: PrismaRlsClient) {}

    async getMessageLeaderboardRaw({
        page,
        limit,
    }: Pagination): Promise<PaginatedResult<LeaderboardEntryResponse>> {
        const offset = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.$queryRaw(messageLeaderboardQuery(limit, offset)),
            this.prisma.user.count(),
        ]);

        return {
            data: data as LeaderboardEntryResponse[],
            pagination: {
                page,
                limit,
                total,
            },
        };
    }

    async getMessageLeaderboardPrisma({
        page,
        limit,
    }: Pagination): Promise<PaginatedResult<LeaderboardEntryResponse>> {
        const users = await this.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                _count: {
                    select: {
                        messages: true,
                    },
                },
            },
        });

        const totalMessages = users.reduce(
            (sum, user) => sum + user._count.messages,
            0
        );

        const leaderboard = users
            .sort((a, b) => {
                const countDifference = b._count.messages - a._count.messages;
                if (countDifference !== 0) {
                    return countDifference;
                }
                return a.name.localeCompare(b.name);
            })
            .map((user, index) => ({
                id: user.id,
                name: user.name,
                messageCount: user._count.messages,
                percentOfAllMessages:
                    totalMessages === 0
                        ? 0
                        : Number(
                              (
                                  (user._count.messages * 100) /
                                  totalMessages
                              ).toFixed(2)
                          ),
                rank: index + 1,
            }));
        const offset = (page - 1) * limit;

        return {
            data: leaderboard.slice(offset, offset + limit),
            pagination: {
                page,
                limit,
                total: leaderboard.length,
            },
        };
    }
}
