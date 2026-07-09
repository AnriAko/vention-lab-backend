import { PrismaClient } from '../../src/generated/prisma/client';
import { faker } from '@faker-js/faker';

const TOTAL_FILES = 200;
const BATCH_SIZE = 100;

export async function seedFiles(prisma: PrismaClient) {
    const users = await prisma.user.findMany({
        select: {
            id: true,
        },
    });

    const organizations = await prisma.organization.findMany({
        select: {
            id: true,
        },
    });

    const filesBatch: {
        ownerId: string;
        organizationId: string;
        filename: string;
        size: number;
        status: string;
        contentType: string;
        storageKey: string;
        application: null;
        processingError: null;
    }[] = [];

    const flush = async () => {
        if (!filesBatch.length) {
            return;
        }

        await prisma.file.createMany({
            data: filesBatch,
        });

        filesBatch.length = 0;
    };

    for (let i = 0; i < TOTAL_FILES; i++) {
        const user = users[Math.floor(Math.random() * users.length)];

        const organization =
            organizations[Math.floor(Math.random() * organizations.length)];

        filesBatch.push({
            ownerId: user.id,
            organizationId: organization.id,
            filename: faker.system.fileName(),
            size: faker.number.int({
                min: 1000,
                max: 5_000_000,
            }),
            status: 'READY',
            contentType: 'application/octet-stream',
            storageKey: faker.string.uuid(),
            application: null,
            processingError: null,
        });

        if (filesBatch.length >= BATCH_SIZE) {
            await flush();
        }
    }

    await flush();

    console.log('Files seeded');
}
