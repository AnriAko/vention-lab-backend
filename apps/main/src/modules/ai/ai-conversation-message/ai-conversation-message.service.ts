import { Injectable } from '@nestjs/common';

import { AiConversationService } from '~/modules/ai/ai-conversation/ai-conversation.service';
import { AiMessageRole } from '~/generated/prisma/enums';

import { AiMessageRepository } from './ai-conversation-message.repository';

@Injectable()
export class AiMessageService {
    constructor(
        private readonly aiMessageRepository: AiMessageRepository,
        private readonly aiConversationService: AiConversationService
    ) {}

    async createUserMessage(conversationId: string, content: string) {
        await this.validateConversation(conversationId);

        return this.aiMessageRepository.create(
            conversationId,
            AiMessageRole.USER,
            content
        );
    }

    async createAssistantMessage(conversationId: string, content: string) {
        await this.validateConversation(conversationId);

        return this.aiMessageRepository.create(
            conversationId,
            AiMessageRole.ASSISTANT,
            content
        );
    }

    async createSystemMessage(conversationId: string, content: string) {
        await this.validateConversation(conversationId);

        return this.aiMessageRepository.create(
            conversationId,
            AiMessageRole.SYSTEM,
            content
        );
    }

    async getConversationHistory(conversationId: string) {
        await this.validateConversation(conversationId);

        return this.aiMessageRepository.findByConversationId(conversationId);
    }

    private async validateConversation(conversationId: string) {
        await this.aiConversationService.findById(conversationId);
    }
}
