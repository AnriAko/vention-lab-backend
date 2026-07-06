import 'dotenv/config';

import { prisma, disconnect } from './client';

async function main() {
    console.log('START CLEAN');

    await prisma.$transaction([
        prisma.file.deleteMany(),
        prisma.message.deleteMany(),
        prisma.usersChats.deleteMany(),
        prisma.chat.deleteMany(),
        prisma.user.deleteMany(),
        prisma.organization.deleteMany(),
    ]);

    console.log('DATABASE CLEANED');
}

main()
    .then(disconnect)
    .catch(async (e) => {
        console.error(e);
        await disconnect();
        process.exit(1);
    });
