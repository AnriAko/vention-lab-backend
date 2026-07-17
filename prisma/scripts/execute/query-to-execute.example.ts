import { Prisma } from '../../../src/generated/prisma/client';

export const QUERY_TO_EXECUTE = Prisma.sql`
    SELECT *
    FROM "User"
    ORDER BY "createdAt" DESC
    LIMIT 10;
`;
