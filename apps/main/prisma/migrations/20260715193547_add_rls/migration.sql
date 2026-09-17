-- ==========================================================
-- Helper functions
-- ==========================================================


CREATE OR REPLACE FUNCTION is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
SELECT EXISTS (
    SELECT 1
    FROM "Owner"
    WHERE "userId" = current_setting('app.current_user', true)
);
$$;


CREATE OR REPLACE FUNCTION is_current_org(org_id text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
SELECT
    org_id = current_setting('app.current_organization', true);
$$;


CREATE OR REPLACE FUNCTION user_in_current_org(target_user_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
SELECT EXISTS (
    SELECT 1
    FROM "UsersOrganizations"
    WHERE "userId" = target_user_id
      AND is_current_org("organizationId")
);
$$;



-- ==========================================================
-- Organization
-- ==========================================================

ALTER TABLE "Organization"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Organization"
FORCE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS organization_policy
ON "Organization";


CREATE POLICY organization_policy
ON "Organization"
USING (
    is_owner()
    OR is_current_org(id)
)
WITH CHECK (
    is_owner()
    OR is_current_org(id)
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
    OR is_current_org("organizationId")
)
WITH CHECK (
    is_owner()
    OR is_current_org("organizationId")
);



-- ==========================================================
-- UsersOrganizationsRoles
-- ==========================================================

ALTER TABLE "UsersOrganizationsRoles"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "UsersOrganizationsRoles"
FORCE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS users_organizations_roles_policy
ON "UsersOrganizationsRoles";


CREATE POLICY users_organizations_roles_policy
ON "UsersOrganizationsRoles"
USING (
    is_owner()
    OR is_current_org("organizationId")
)
WITH CHECK (
    is_owner()
    OR is_current_org("organizationId")
);



-- ==========================================================
-- Owner
-- ==========================================================

ALTER TABLE "Owner"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Owner"
FORCE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS owner_policy
ON "Owner";


CREATE POLICY owner_policy
ON "Owner"
USING (
    "userId" = current_setting('app.current_user', true)
)
WITH CHECK (
    "userId" = current_setting('app.current_user', true)
);



-- ==========================================================
-- User
-- ==========================================================

ALTER TABLE "User"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "User"
FORCE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS user_policy
ON "User";


CREATE POLICY user_policy
ON "User"
USING (
    is_owner()
    OR user_in_current_org(id)
)
WITH CHECK (
    is_owner()
    OR user_in_current_org(id)
);



-- ==========================================================
-- File
-- ==========================================================

ALTER TABLE "File"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "File"
FORCE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS file_policy
ON "File";


CREATE POLICY file_policy
ON "File"
USING (
    is_owner()
    OR is_current_org("organizationId")
)
WITH CHECK (
    is_owner()
    OR is_current_org("organizationId")
);



-- ==========================================================
-- Chat
-- ==========================================================

ALTER TABLE "Chat"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Chat"
FORCE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS chat_policy
ON "Chat";


CREATE POLICY chat_policy
ON "Chat"
USING (
    is_owner()
    OR is_current_org("organizationId")
)
WITH CHECK (
    is_owner()
    OR is_current_org("organizationId")
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
        WHERE "Chat"."id" = "UsersChats"."chatId"
          AND is_current_org("Chat"."organizationId")
    )
)
WITH CHECK (
    is_owner()
    OR EXISTS (
        SELECT 1
        FROM "Chat"
        WHERE "Chat"."id" = "UsersChats"."chatId"
          AND is_current_org("Chat"."organizationId")
    )
);



-- ==========================================================
-- Message
-- ==========================================================

ALTER TABLE "Message"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Message"
FORCE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS message_policy
ON "Message";


CREATE POLICY message_policy
ON "Message"
USING (
    is_owner()
    OR EXISTS (
        SELECT 1
        FROM "Chat"
        WHERE "Chat"."id" = "Message"."chatId"
          AND is_current_org("Chat"."organizationId")
    )
)
WITH CHECK (
    is_owner()
    OR EXISTS (
        SELECT 1
        FROM "Chat"
        WHERE "Chat"."id" = "Message"."chatId"
          AND is_current_org("Chat"."organizationId")
    )
);