import { Injectable } from '@nestjs/common';
import { PrismaRlsClient } from '~/common/tenancy/rls/prisma-rls.client';
import { AiConversationMessageRole } from '~/generated/prisma/enums';

@Injectable()
export class AiMessageRepository {
    constructor(private readonly prisma: PrismaRlsClient) {}

    findByConversationId(conversationId: string) {
        return this.prisma.aiConversationMessage.findMany({
            where: {
                conversationId,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }

    create(
        conversationId: string,
        role: AiConversationMessageRole,
        content: string
    ) {
        return this.prisma.aiConversationMessage.create({
            data: {
                conversationId,
                role,
                content,
            },
        });
    }
}
