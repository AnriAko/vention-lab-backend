import { PrismaClient } from '../../src/generated/prisma/client';

import { faker } from '@faker-js/faker';

const TOTAL_MESSAGES = 200;
const BATCH_SIZE = 100;

export async function seedMessages(
    prisma: PrismaClient,
    chats: { id: string }[]
): Promise<void> {
    const chatUsers = await prisma.usersChats.findMany();

    const chatUserMap = new Map<string, string[]>();

    for (const cu of chatUsers) {
        if (!chatUserMap.has(cu.chatId)) {
            chatUserMap.set(cu.chatId, []);
        }

        chatUserMap.get(cu.chatId)!.push(cu.userId);
    }

    let messagesBatch: {
        chatId: string;
        senderId: string;
        content: string;
    }[] = [];

    const flush = async () => {
        if (!messagesBatch.length) {
            return;
        }

        await prisma.message.createMany({
            data: messagesBatch,
        });

        messagesBatch.length = 0;
    };

    for (let i = 0; i < TOTAL_MESSAGES; i++) {
        const chat = chats[Math.floor(Math.random() * chats.length)];

        const userIds = chatUserMap.get(chat.id) || [];

        if (!userIds.length) {
            continue;
        }

        messagesBatch.push({
            chatId: chat.id,
            senderId: userIds[Math.floor(Math.random() * userIds.length)],
            content: faker.lorem.sentence(),
        });

        if (messagesBatch.length >= BATCH_SIZE) {
            await flush();
        }
    }

    await flush();

    console.log('Messages seeded');
}
