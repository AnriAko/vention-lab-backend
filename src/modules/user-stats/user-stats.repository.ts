import { Injectable } from '@nestjs/common';
import { OffsetPaginationDto } from '~/common/dto/offset-pagination.dto';
import { PrismaRlsService } from '~/infrastructure/database/prisma-rls.service';
import { messageLeaderboardQuery } from '~/modules/user-stats/user-stats.queries';

@Injectable()
export class UserStatsRepository {
    constructor(private readonly prismaRls: PrismaRlsService) {}

    async getMessageLeaderboardRaw({ page, limit }: OffsetPaginationDto) {
        const offset = (page - 1) * limit;
        return this.prismaRls.transaction((tx) =>
            tx.$queryRaw(messageLeaderboardQuery(limit, offset))
        );
    }

    async getMessageLeaderboardPrisma({ page, limit }: OffsetPaginationDto) {
        return this.prismaRls.transaction(async (tx) => {
            const users = await tx.user.findMany({
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
                    const countDifference =
                        b._count.messages - a._count.messages;
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
            return leaderboard.slice(offset, offset + limit);
        });
    }
}
