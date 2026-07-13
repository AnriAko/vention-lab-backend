-- User search vector

ALTER TABLE "User"
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
    to_tsvector(
        'simple',
        coalesce(name,'') || ' ' ||
        coalesce(email,'')
    )
) STORED;


CREATE INDEX user_search_vector_idx
ON "User"
USING GIN(search_vector);


-- Organization search vector

ALTER TABLE "Organization"
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
    to_tsvector(
        'simple',
        coalesce(name,'')
    )
) STORED;


CREATE INDEX organization_search_vector_idx
ON "Organization"
USING GIN(search_vector);