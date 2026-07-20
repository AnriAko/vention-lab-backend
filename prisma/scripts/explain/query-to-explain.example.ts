export const EXPLAIN_ANALYZE = `
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
`;

export const EXPLAIN_ONLY = `
EXPLAIN (BUFFERS, VERBOSE)
`;

export const QUERY_TO_EXPLAIN = `
SELECT 
    "User"."id",
    "User"."email",
    "User"."name",
    "User"."role",
    "User"."image",
    "User"."isDeleted",
    "User"."createdAt",
    "User"."updatedAt"

FROM "User"

WHERE
    "User"."isDeleted" = false

ORDER BY
    "User"."createdAt" DESC,
    "User"."id" DESC

LIMIT 101;
`;
