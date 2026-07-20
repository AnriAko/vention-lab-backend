import { Prisma } from '~/generated/prisma/client';

export const messageLeaderboardQuery = (
    limit: number,
    offset: number
) => Prisma.sql`
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
