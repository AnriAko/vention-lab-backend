import { Injectable } from '@nestjs/common';
import { OffsetPaginationDto } from '~/common/dto/offset-pagination.dto';
import { PrismaService } from '~/infrastructure/database/prisma.service';

@Injectable()
export class UserStatsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async getMessageLeaderboardRaw({ page, limit }: OffsetPaginationDto) {
        const offset = (page - 1) * limit;

        return this.prisma.$queryRaw<
            {
                id: string;
                name: string;
                messageCount: number;
                percentOfAllMessages: number;
                rank: number;
            }[]
        >`
            SELECT
                u.id,
                u.name,
                COUNT(m.id)::int AS "messageCount",
                ROUND(
                    COUNT(m.id) * 100.0
                    / SUM(COUNT(m.id)) OVER (),
                    2
                ) AS "percentOfAllMessages",
                RANK() OVER (
                    ORDER BY COUNT(m.id) DESC
                )::int AS "rank"
            FROM "User" u
            LEFT JOIN "Message" m
                ON m."senderId" = u.id
            GROUP BY
                u.id,
                u.name
            ORDER BY
                "messageCount" DESC
            LIMIT ${limit}
            OFFSET ${offset};
        `;
    }

    async getMessageLeaderboardPrisma({ page, limit }: OffsetPaginationDto) {
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

        return leaderboard.slice(offset, offset + limit);
    }
}
