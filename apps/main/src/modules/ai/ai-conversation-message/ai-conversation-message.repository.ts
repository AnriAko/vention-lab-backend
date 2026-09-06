import { Injectable } from '@nestjs/common';
import { PrismaRlsClient } from '~/common/tenancy/rls/prisma-rls.client';
import { AiMessageRole } from '~/generated/prisma/enums';

@Injectable()
export class AiMessageRepository {
    constructor(private readonly prisma: PrismaRlsClient) {}

    async findByConversationId(conversationId: string) {
        return this.prisma.aiMessage.findMany({
            where: {
                conversationId,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }

    async create(conversationId: string, role: AiMessageRole, content: string) {
        return this.prisma.aiMessage.create({
            data: {
                conversationId,
                role,
                content,
            },
        });
    }
}
