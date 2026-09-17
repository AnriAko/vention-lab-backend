import 'dotenv/config';

import { performance } from 'node:perf_hooks';

import { prisma, disconnect } from './client';

import { seedUsers } from './seed/users.seed';
import { seedChats } from './seed/chats.seed';
import { seedMessages } from './seed/messages.seed';
import { seedFiles } from './seed/files.seed';
import { seedOrganizations } from './seed/organizations.seed';

async function main() {
    const start = performance.now();

    try {
        console.log('START SEED');

        const organizations = await seedOrganizations(prisma);
        console.log('ORG DONE');

        await seedUsers(prisma, organizations);

        console.log('USERS DONE');

        const chats = await seedChats(prisma);

        console.log('CHATS DONE');

        await seedMessages(prisma, chats);

        console.log('MESSAGES DONE');

        await seedFiles(prisma);

        console.log('FILES DONE');

        const end = performance.now();

        console.log(`SEED COMPLETED IN ${(end - start).toFixed(2)} ms`);
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
