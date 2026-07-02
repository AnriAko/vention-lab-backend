import { PrismaClient, User } from '../../src/generated/prisma/client';

export async function seedChats(prisma: PrismaClient, users: User[]) {
    const chatsData: { id: string }[] = [];
    const chatUsersData: { chatId: string; userId: string }[] = [];

    for (let i = 0; i < users.length; i++) {
        for (let j = i + 1; j < users.length; j++) {
            const userA = users[i];
            const userB = users[j];

            if (Math.random() > 0.25) continue;

            const chatId = crypto.randomUUID();

            chatsData.push({ id: chatId });

            chatUsersData.push(
                { chatId, userId: userA.id },
                { chatId, userId: userB.id }
            );
        }
    }

    await prisma.$transaction([
        prisma.chat.createMany({ data: chatsData }),
        prisma.usersChats.createMany({ data: chatUsersData }),
    ]);

    return prisma.chat.findMany();
}
