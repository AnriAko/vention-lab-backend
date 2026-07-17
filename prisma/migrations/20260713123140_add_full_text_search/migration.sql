-- User search vector

ALTER TABLE "User"
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
    setweight(
        to_tsvector(
            'english',
            coalesce(name, '')
        ),
        'A'
    )
    ||
    setweight(
        to_tsvector(
            'english',
            coalesce(email, '')
        ),
        'B'
    )
) STORED;


CREATE INDEX user_search_vector_idx
ON "User"
USING GIN(search_vector);


-- Organization search vector

ALTER TABLE "Organization"
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
    setweight(
        to_tsvector(
            'english',
            coalesce(name, '')
        ),
        'A'
    )
) STORED;


CREATE INDEX organization_search_vector_idx
ON "Organization"
USING GIN(search_vector);