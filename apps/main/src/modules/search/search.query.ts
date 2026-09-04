import { Prisma } from '~/generated/prisma/client';

export const searchUsersQuery = (
    query: string,
    limit: number,
    offset: number
) => Prisma.sql`
    SELECT
        u.id,
        u.name,
        u.email,
        ts_rank(
            u.search_vector,
            plainto_tsquery('english', ${query})
        ) AS rank
    FROM "User" u
    WHERE
        u.search_vector @@ plainto_tsquery(
            'english',
            ${query}
        )
    AND EXISTS (
        SELECT 1
        FROM "UsersOrganizations" uo
        WHERE uo."userId" = u.id
          AND uo."isDeleted" = false
    )
    ORDER BY rank DESC
    LIMIT ${limit}
    OFFSET ${offset};
`;

export const searchOrganizationsQuery = (
    query: string,
    limit: number,
    offset: number
) => Prisma.sql`
    SELECT
        id,
        name,
        ts_rank(
            search_vector,
            plainto_tsquery('english', ${query})
        ) AS rank
    FROM "Organization"
    WHERE
        search_vector @@ plainto_tsquery(
            'english',
            ${query}
        )
    AND "isDeleted" = false
    ORDER BY rank DESC
    LIMIT ${limit}
    OFFSET ${offset};
`;
