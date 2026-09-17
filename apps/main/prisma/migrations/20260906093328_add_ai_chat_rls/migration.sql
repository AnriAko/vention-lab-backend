-- This is an empty migration.

-- ==========================================================
-- AiConversation
-- ==========================================================

ALTER TABLE "AiConversation"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "AiConversation"
FORCE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS ai_conversation_policy
ON "AiConversation";


CREATE POLICY ai_conversation_policy
ON "AiConversation"

USING (
    is_owner()
    OR "userId" = current_setting('app.current_user', true)
)

WITH CHECK (
    is_owner()
    OR "userId" = current_setting('app.current_user', true)
);


-- ==========================================================
-- AiMessage
-- ==========================================================

ALTER TABLE "AiMessage"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "AiMessage"
FORCE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS ai_message_policy
ON "AiMessage";


CREATE POLICY ai_message_policy
ON "AiMessage"

USING (
    is_owner()
    OR EXISTS (
        SELECT 1
        FROM "AiConversation"
        WHERE "AiConversation"."id" = "AiMessage"."conversationId"
          AND "AiConversation"."userId" =
              current_setting('app.current_user', true)
    )
)

WITH CHECK (
    is_owner()
    OR EXISTS (
        SELECT 1
        FROM "AiConversation"
        WHERE "AiConversation"."id" = "AiMessage"."conversationId"
          AND "AiConversation"."userId" =
              current_setting('app.current_user', true)
    )
);
