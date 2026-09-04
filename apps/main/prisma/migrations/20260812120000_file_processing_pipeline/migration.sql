-- FileStatus: add UPLOADING/COMPLETED/FAILED, map PROCESSED→COMPLETED, ERROR→FAILED
CREATE TYPE "FileStatus_new" AS ENUM (
    'UPLOADING',
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
        WHEN 'PROCESSED' THEN 'COMPLETED'
        WHEN 'ERROR' THEN 'FAILED'
        ELSE "status"::text
    END::"FileStatus_new"
);

DROP TYPE "FileStatus";

ALTER TYPE "FileStatus_new" RENAME TO "FileStatus";

ALTER TABLE "File" ALTER COLUMN "status" SET DEFAULT 'UPLOADED'::"FileStatus";

-- Membership money spent (Decimal)
ALTER TABLE "UsersOrganizations"
ADD COLUMN "moneySpent" DECIMAL(19, 4) NOT NULL DEFAULT 0;
