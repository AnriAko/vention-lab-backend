CREATE TYPE "FileStatus_new" AS ENUM (
    'UPLOADED',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);

ALTER TABLE "File" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "File"
ALTER COLUMN "status" TYPE "FileStatus_new"
USING (
    CASE "status"::text
        WHEN 'UPLOADING' THEN 'UPLOADED'
        ELSE "status"::text
    END::"FileStatus_new"
);

DROP TYPE "FileStatus";

ALTER TYPE "FileStatus_new" RENAME TO "FileStatus";

ALTER TABLE "File" ALTER COLUMN "status" SET DEFAULT 'UPLOADED'::"FileStatus";
