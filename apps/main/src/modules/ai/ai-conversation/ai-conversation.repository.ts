import { Injectable } from '@nestjs/common';
import type { Prisma } from '~/generated/prisma/client';

import { PrismaRlsClient } from '~/common/tenancy/rls/prisma-rls.client';

@Injectable()
export class AiConversationRepository {
    constructor(private readonly prisma: PrismaRlsClient) {}

    findManyByUserId(userId: string) {
        return this.prisma.aiConversation.findMany({
            where: {
                userId,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });
    }

    findById(id: string) {
        return this.prisma.aiConversation.findUnique({
            where: {
                id,
            },
        });
    }

    create(data: Prisma.AiConversationCreateInput) {
        return this.prisma.aiConversation.create({
            data,
        });
    }

    update(id: string, data: Prisma.AiConversationUpdateInput) {
        return this.prisma.aiConversation.update({
            where: {
                id,
            },
            data,
        });
    }

    async delete(id: string) {
        await this.prisma.aiConversation.delete({
            where: {
                id,
            },
        });
    }
}
