import { PrismaClient, Chat, User } from '../../src/generated/prisma/client';

import { faker } from '@faker-js/faker';

export async function seedMessages(
    prisma: PrismaClient,
    chats: Chat[]
): Promise<void> {
    const chatUsers = await prisma.usersChats.findMany();

    const chatUserMap = new Map<string, string[]>();

    for (const cu of chatUsers) {
        if (!chatUserMap.has(cu.chatId)) {
            chatUserMap.set(cu.chatId, []);
        }
        chatUserMap.get(cu.chatId)!.push(cu.userId);
    }

    const messagesData: {
        chatId: string;
        senderId: string;
        content: string;
    }[] = [];

    for (const chat of chats) {
        const userIds = chatUserMap.get(chat.id) || [];

        const count = faker.number.int({ min: 5, max: 20 });

        for (let i = 0; i < count; i++) {
            messagesData.push({
                chatId: chat.id,
                senderId: userIds[Math.floor(Math.random() * userIds.length)],
                content: faker.lorem.sentence(),
            });
        }
    }

    await prisma.message.createMany({
        data: messagesData,
    });

    console.log('Messages seeded');
}
