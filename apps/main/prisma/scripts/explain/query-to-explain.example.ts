export const EXPLAIN_ANALYZE = `
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
`;

export const EXPLAIN_ONLY = `
EXPLAIN (BUFFERS, VERBOSE)
`;

export const QUERY_TO_EXPLAIN = `SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'User';`;
