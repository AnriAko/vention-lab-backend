-- ==========================================================
-- Helper functions
-- ==========================================================

CREATE OR REPLACE FUNCTION is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1
    FROM "User"
    WHERE id = current_setting('app.current_user', true)
      AND role = 'OWNER'
);
$$;


CREATE OR REPLACE FUNCTION user_in_current_org(user_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1
    FROM "UsersOrganizations"
    WHERE "UsersOrganizations"."userId" = user_id
      AND "organizationId" =
          current_setting('app.current_organization', true)
);
$$;


CREATE OR REPLACE FUNCTION current_user_has_org(org_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1
    FROM "UsersOrganizations"
    WHERE "UsersOrganizations"."organizationId" = org_id
      AND "UsersOrganizations"."userId" =
          current_setting('app.current_user', true)
);
$$;


-- ==========================================================
-- Organization
-- ==========================================================

ALTER TABLE "Organization"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Organization"
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organization_policy ON "Organization";

CREATE POLICY organization_policy
ON "Organization"
USING (
    is_owner()
    OR current_user_has_org(id)
)
WITH CHECK (
    is_owner()
    OR current_user_has_org(id)
);


-- ==========================================================
-- UsersOrganizations
-- ==========================================================

ALTER TABLE "UsersOrganizations"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "UsersOrganizations"
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_organizations_policy
ON "UsersOrganizations";

CREATE POLICY users_organizations_policy
ON "UsersOrganizations"
USING (
    is_owner()
    OR
    "organizationId" =
        current_setting('app.current_organization', true)
)
WITH CHECK (
    is_owner()
    OR
    "organizationId" =
        current_setting('app.current_organization', true)
);


-- ==========================================================
-- File
-- ==========================================================

ALTER TABLE "File"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "File"
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS file_policy ON "File";

CREATE POLICY file_policy
ON "File"
USING (
    is_owner()
    OR current_user_has_org("organizationId")
)
WITH CHECK (
    is_owner()
    OR current_user_has_org("organizationId")
);


-- ==========================================================
-- Chat
-- ==========================================================

ALTER TABLE "Chat"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Chat"
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_policy ON "Chat";

CREATE POLICY chat_policy
ON "Chat"
USING (
    is_owner()
    OR current_user_has_org("organizationId")
)
WITH CHECK (
    is_owner()
    OR current_user_has_org("organizationId")
);


-- ==========================================================
-- Message
-- ==========================================================

ALTER TABLE "Message"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Message"
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS message_policy ON "Message";

CREATE POLICY message_policy
ON "Message"
USING (
    is_owner()
    OR EXISTS (
        SELECT 1
        FROM "Chat"
        WHERE "Chat".id = "Message"."chatId"
          AND current_user_has_org("organizationId")
    )
)
WITH CHECK (
    is_owner()
    OR EXISTS (
        SELECT 1
        FROM "Chat"
        WHERE "Chat".id = "Message"."chatId"
          AND current_user_has_org("organizationId")
    )
);


-- ==========================================================
-- UsersChats
-- ==========================================================

ALTER TABLE "UsersChats"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "UsersChats"
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_chats_policy
ON "UsersChats";

CREATE POLICY users_chats_policy
ON "UsersChats"
USING (
    is_owner()
    OR EXISTS (
        SELECT 1
        FROM "Chat"
        WHERE "Chat".id = "UsersChats"."chatId"
          AND current_user_has_org("organizationId")
    )
)
WITH CHECK (
    is_owner()
    OR EXISTS (
        SELECT 1
        FROM "Chat"
        WHERE "Chat".id = "UsersChats"."chatId"
          AND current_user_has_org("organizationId")
    )
);


-- ==========================================================
-- User
-- ==========================================================

ALTER TABLE "User"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "User"
FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_policy ON "User";

CREATE POLICY user_policy
ON "User"
USING (
    is_owner()
    OR user_in_current_org(id)
)
-- INSERT/UPDATE: allow platform OWNER, or any member of the active org.
-- New users are not in UsersOrganizations yet, so user_in_current_org(id) cannot
-- be used for WITH CHECK on create; membership is inserted in the same transaction.
WITH CHECK (
    is_owner()
    OR current_user_has_org(
        current_setting('app.current_organization', true)
    )
);