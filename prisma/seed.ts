import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

import { seedUsers } from './seed/users.seed';
import { seedChats } from './seed/chats.seed';
import { seedMessages } from './seed/messages.seed';
import { seedFiles } from './seed/files.seed';
import { seedOrganizations } from './seed/organizations.seed';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
    log: ['error', 'warn'],
} as any);

async function main() {
    try {
        console.log('START SEED');

        await prisma.$transaction([
            prisma.file.deleteMany(),
            prisma.message.deleteMany(),
            prisma.usersChats.deleteMany(),
            prisma.chat.deleteMany(),
            prisma.user.deleteMany(),
            prisma.organization.deleteMany(),
        ]);

        console.log('DELETE DONE');

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
    .then(async () => {
        await prisma.$disconnect();
        await pool.end();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        await pool.end();
        process.exit(1);
    });
