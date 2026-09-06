import { Injectable } from '@nestjs/common';

import { AiConversationMessageRole } from '~/generated/prisma/enums';
import { AiConversationService } from '~/modules/ai/ai-conversation/ai-conversation.service';

import { AiMessageRepository } from './ai-conversation-message.repository';

@Injectable()
export class AiConversationMessageService {
    constructor(
        private readonly aiMessageRepository: AiMessageRepository,
        private readonly aiConversationService: AiConversationService
    ) {}

    async createUserMessage(conversationId: string, content: string) {
        await this.validateConversation(conversationId);

        return this.aiMessageRepository.create(
            conversationId,
            AiConversationMessageRole.USER,
            content
        );
    }

    async createAssistantMessage(conversationId: string, content: string) {
        await this.validateConversation(conversationId);

        return this.aiMessageRepository.create(
            conversationId,
            AiConversationMessageRole.ASSISTANT,
            content
        );
    }

    async createSystemMessage(conversationId: string, content: string) {
        await this.validateConversation(conversationId);

        return this.aiMessageRepository.create(
            conversationId,
            AiConversationMessageRole.SYSTEM,
            content
        );
    }

    async getConversationHistory(conversationId: string) {
        await this.validateConversation(conversationId);

        return this.aiMessageRepository.findByConversationId(conversationId);
    }

    private async validateConversation(conversationId: string): Promise<void> {
        await this.aiConversationService.findById(conversationId);
    }
}
