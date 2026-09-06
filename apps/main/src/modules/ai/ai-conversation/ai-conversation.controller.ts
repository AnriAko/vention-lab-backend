import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';

import { AiConversationService } from '~/modules/ai/ai-conversation/ai-conversation.service';

type UpdateConversationBody = {
    title: string;
};

@Controller('ai/conversations')
export class AiConversationController {
    constructor(
        private readonly aiConversationService: AiConversationService
    ) {}

    @Get()
    getConversations() {
        return this.aiConversationService.findAll();
    }

    @Get(':conversationId')
    getConversation(@Param('conversationId') conversationId: string) {
        return this.aiConversationService.findById(conversationId);
    }

    @Patch(':conversationId')
    updateConversation(
        @Param('conversationId') conversationId: string,
        @Body() body: UpdateConversationBody
    ) {
        return this.aiConversationService.update(conversationId, body.title);
    }

    @Delete(':conversationId')
    async deleteConversation(@Param('conversationId') conversationId: string) {
        await this.aiConversationService.remove(conversationId);

        return { success: true };
    }
}
