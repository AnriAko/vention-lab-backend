import { PrismaClient } from '../../src/generated/prisma/client';

const TOTAL_CHATS = 200;
const BATCH_SIZE = 100;

type OrgMembers = {
    organizationId: string;
    userIds: string[];
};

export async function seedChats(prisma: PrismaClient) {
    const memberships = await prisma.usersOrganizations.findMany({
        select: {
            userId: true,
            organizationId: true,
        },
    });

    const membersByOrg = new Map<string, string[]>();

    for (const membership of memberships) {
        const members = membersByOrg.get(membership.organizationId) ?? [];
        members.push(membership.userId);
        membersByOrg.set(membership.organizationId, members);
    }

    const orgMembers: OrgMembers[] = [...membersByOrg.entries()]
        .map(([organizationId, userIds]) => ({ organizationId, userIds }))
        .filter(({ userIds }) => userIds.length >= 2);

    if (!orgMembers.length) {
        throw new Error('Need at least one organization with two members to seed chats');
    }

    const chatsBatch: {
        id: string;
        organizationId: string;
    }[] = [];

    const chatUsersBatch: {
        chatId: string;
        userId: string;
    }[] = [];

    const flush = async () => {
        if (!chatsBatch.length) {
            return;
        }

        await prisma.chat.createMany({
            data: chatsBatch,
        });

        await prisma.usersChats.createMany({
            data: chatUsersBatch,
        });

        chatsBatch.length = 0;
        chatUsersBatch.length = 0;
    };

    for (let i = 0; i < TOTAL_CHATS; i++) {
        const org =
            orgMembers[Math.floor(Math.random() * orgMembers.length)];

        const userA =
            org.userIds[Math.floor(Math.random() * org.userIds.length)];

        let userB = org.userIds[Math.floor(Math.random() * org.userIds.length)];

        while (userA === userB) {
            userB = org.userIds[Math.floor(Math.random() * org.userIds.length)];
        }

        const chatId = crypto.randomUUID();

        chatsBatch.push({
            id: chatId,
            organizationId: org.organizationId,
        });

        chatUsersBatch.push(
            {
                chatId,
                userId: userA,
            },
            {
                chatId,
                userId: userB,
            }
        );

        if (chatsBatch.length >= BATCH_SIZE) {
            await flush();
        }
    }

    await flush();

    return prisma.chat.findMany({
        select: {
            id: true,
            organizationId: true,
        },
    });
}
