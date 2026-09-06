import { Injectable, NotFoundException } from '@nestjs/common';

import { getRequestContext } from '~/common/tenancy/request-context/request-context';

import { AiConversationRepository } from './ai-conversation.repository';

@Injectable()
export class AiConversationService {
    constructor(
        private readonly aiConversationRepository: AiConversationRepository
    ) {}

    findAll() {
        const { userId } = getRequestContext();

        return this.aiConversationRepository.findManyByUserId(userId);
    }

    async findById(id: string) {
        const { userId } = getRequestContext();

        const conversation = await this.aiConversationRepository.findById(id);

        if (!conversation || conversation.userId !== userId) {
            throw new NotFoundException('Conversation not found');
        }

        return conversation;
    }

    async update(id: string, title: string) {
        await this.findById(id);

        const normalizedTitle = title.trim();

        if (!normalizedTitle) {
            throw new Error('Conversation title cannot be empty');
        }

        return this.aiConversationRepository.update(id, {
            title: normalizedTitle,
        });
    }

    async remove(id: string): Promise<void> {
        await this.findById(id);

        await this.aiConversationRepository.delete(id);
    }

    async create(title = 'New conversation') {
        const { userId } = getRequestContext();

        return this.aiConversationRepository.create({
            user: {
                connect: {
                    id: userId,
                },
            },
            title,
        });
    }
}
