import 'dotenv/config';

import { prisma, disconnect } from './client';

import { seedUsers } from './seed/users.seed';
import { seedChats } from './seed/chats.seed';
import { seedMessages } from './seed/messages.seed';
import { seedFiles } from './seed/files.seed';
import { seedOrganizations } from './seed/organizations.seed';

async function main() {
    try {
        console.log('START SEED');

        const organizations = await seedOrganizations(prisma);
        console.log('ORG DONE');

        const users = await seedUsers(prisma, organizations);
        console.log('USERS DONE');

        const chats = await seedChats(prisma, users);
        console.log('CHATS DONE');

        await seedMessages(prisma, chats);
        console.log('MESSAGES DONE');

        await seedFiles(prisma, users);
        console.log('FILES DONE');

        console.log('SEED COMPLETED');
    } catch (e) {
        console.error('SEED ERROR:', e);
        process.exit(1);
    }
}

main()
    .then(disconnect)
    .catch(async (e) => {
        console.error(e);
        await disconnect();
        process.exit(1);
    });
