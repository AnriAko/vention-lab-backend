import { PrismaClient } from '../../src/generated/prisma/client';

const TOTAL_CHATS = 200;
const BATCH_SIZE = 100;

export async function seedChats(prisma: PrismaClient) {
    const users = await prisma.user.findMany({
        select: {
            id: true,
        },
    });

    const chatsBatch: {
        id: string;
    }[] = [];

    const chatUsersBatch: {
        chatId: string;
        userId: string;
    }[] = [];

    for (let i = 0; i < TOTAL_CHATS; i++) {
        const userA = users[Math.floor(Math.random() * users.length)];

        let userB = users[Math.floor(Math.random() * users.length)];

        while (userA.id === userB.id) {
            userB = users[Math.floor(Math.random() * users.length)];
        }

        const chatId = crypto.randomUUID();

        chatsBatch.push({
            id: chatId,
        });

        chatUsersBatch.push(
            {
                chatId,
                userId: userA.id,
            },
            {
                chatId,
                userId: userB.id,
            }
        );

        if (chatsBatch.length >= BATCH_SIZE) {
            await prisma.chat.createMany({
                data: chatsBatch,
            });

            await prisma.usersChats.createMany({
                data: chatUsersBatch,
            });

            chatsBatch.length = 0;
            chatUsersBatch.length = 0;
        }
    }

    if (chatsBatch.length) {
        await prisma.chat.createMany({
            data: chatsBatch,
        });

        await prisma.usersChats.createMany({
            data: chatUsersBatch,
        });
    }

    return prisma.chat.findMany({
        select: {
            id: true,
        },
    });
}
