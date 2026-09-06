-- This is an empty migration.
-- ==========================================================
-- AiConversationMessage
-- ==========================================================

ALTER TABLE "AiConversationMessage"
ENABLE ROW LEVEL SECURITY;

ALTER TABLE "AiConversationMessage"
FORCE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS ai_conversation_message_policy
ON "AiConversationMessage";


CREATE POLICY ai_conversation_message_policy
ON "AiConversationMessage"

USING (
    is_owner()
    OR EXISTS (
        SELECT 1
        FROM "AiConversation"
        WHERE "AiConversation"."id" = "AiConversationMessage"."conversationId"
          AND "AiConversation"."userId" =
              current_setting('app.current_user', true)
    )
)

WITH CHECK (
    is_owner()
    OR EXISTS (
        SELECT 1
        FROM "AiConversation"
        WHERE "AiConversation"."id" = "AiConversationMessage"."conversationId"
          AND "AiConversation"."userId" =
              current_setting('app.current_user', true)
    )
);