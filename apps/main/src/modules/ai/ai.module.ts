import { Module } from '@nestjs/common';

import { WsAuthGuard } from '~/common/security/ws-security/ws-auth.guard';
import { WsOrganizationGuard } from '~/common/security/ws-security/ws-organization.guard';

import { AiConversationController } from './ai-conversation/ai-conversation.controller';
import { AiConversationRepository } from './ai-conversation/ai-conversation.repository';
import { AiConversationService } from './ai-conversation/ai-conversation.service';

import { AiConversationMessageService } from './ai-conversation-message/ai-conversation-message.service';
import { AiMessageRepository } from './ai-conversation-message/ai-conversation-message.repository';

import { AiGenerationGateway } from './ai-generation/ai.generation.gateway';
import { AiGenerationService } from './ai-generation/ai.generation.service';
import { WsSecurityModule } from '~/common/security/ws-security/ws-security.module';

@Module({
    imports: [WsSecurityModule],
    controllers: [AiConversationController],

    providers: [
        // Conversations
        AiConversationRepository,
        AiConversationService,

        // Messages
        AiMessageRepository,
        AiConversationMessageService,

        // Generation
        AiGenerationService,
        AiGenerationGateway,

        // WebSocket guards
        WsAuthGuard,
        WsOrganizationGuard,
    ],

    exports: [
        AiConversationService,
        AiConversationMessageService,
        AiGenerationService,
    ],
})
export class AiModule {}
