import { faker } from '@faker-js/faker';

import { PrismaClient } from '../../src/generated/prisma/client';
import {
    SEED_ORGANIZATIONS,
    SEED_USERS,
} from '../../src/common/swagger/seed-examples';

const TOTAL_MESSAGES = 500;
const BATCH_SIZE = 100;

export async function seedMessages(
    prisma: PrismaClient,
    chats: { id: string; organizationId?: string }[]
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

    const catFansChat =
        chats.find(
            (chat) => chat.organizationId === SEED_ORGANIZATIONS.catFans.id
        ) ?? chats[0];

    const boostCandidates = [
        { userId: SEED_USERS.demoMember.id, count: 40 },
        { userId: SEED_ORGANIZATIONS.catFans.adminId, count: 25 },
        { userId: SEED_USERS.owner.id, count: 15 },
    ];

    const existingBoostUsers = await prisma.user.findMany({
        where: {
            id: { in: boostCandidates.map((candidate) => candidate.userId) },
        },
        select: { id: true },
    });
    const existingBoostIds = new Set(existingBoostUsers.map((user) => user.id));

    if (catFansChat) {
        for (const boost of boostCandidates) {
            if (!existingBoostIds.has(boost.userId)) {
                continue;
            }

            for (let i = 0; i < boost.count; i++) {
                messagesBatch.push({
                    chatId: catFansChat.id,
                    senderId: boost.userId,
                    content: faker.lorem.sentence(),
                });

                if (messagesBatch.length >= BATCH_SIZE) {
                    await flush();
                }
            }
        }
    }

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
