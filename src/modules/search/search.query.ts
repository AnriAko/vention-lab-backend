import { Prisma } from '~/generated/prisma/client';

export const searchUsersQuery = (
    query: string,
    limit: number,
    offset: number
) => Prisma.sql`
    SELECT
        id,
        name,
        email,
        ts_rank(
            search_vector,
            plainto_tsquery('simple', ${query})
        ) AS rank
    FROM "User"
    WHERE
        search_vector @@ plainto_tsquery(
            'simple',
            ${query}
        )
    AND "isDeleted" = false
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
            plainto_tsquery('simple', ${query})
        ) AS rank
    FROM "Organization"
    WHERE
        search_vector @@ plainto_tsquery(
            'simple',
            ${query}
        )
    AND "isDeleted" = false
    ORDER BY rank DESC
    LIMIT ${limit}
    OFFSET ${offset};
`;
