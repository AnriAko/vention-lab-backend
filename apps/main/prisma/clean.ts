import 'dotenv/config';

import { prisma, disconnect } from './client';

async function main() {
    console.log('START CLEAN');

    await prisma.$transaction(
        [
            prisma.aiConversationMessage.deleteMany(),
            prisma.aiConversation.deleteMany(),

            prisma.message.deleteMany(),
            prisma.usersChats.deleteMany(),
            prisma.file.deleteMany(),
            prisma.chat.deleteMany(),
            prisma.usersOrganizationsRoles.deleteMany(),
            prisma.usersOrganizations.deleteMany(),
            prisma.owner.deleteMany(),
            prisma.user.deleteMany(),
            prisma.organization.deleteMany(),
        ],
        {
            timeout: 10_000,
        }
    );

    console.log('DATABASE CLEANED');
}

main()
    .then(disconnect)
    .catch(async (e) => {
        console.error(e);
        await disconnect();
        process.exit(1);
    });
