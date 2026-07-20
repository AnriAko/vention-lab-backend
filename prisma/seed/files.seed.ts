import { PrismaClient } from '../../src/generated/prisma/client';
import { faker } from '@faker-js/faker';

const TOTAL_FILES = 200;
const BATCH_SIZE = 100;

export async function seedFiles(prisma: PrismaClient) {
    const memberships = await prisma.usersOrganizations.findMany({
        select: {
            userId: true,
            organizationId: true,
        },
    });

    if (!memberships.length) {
        throw new Error('Need organization memberships to seed files');
    }

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
        const membership =
            memberships[Math.floor(Math.random() * memberships.length)];

        filesBatch.push({
            ownerId: membership.userId,
            organizationId: membership.organizationId,
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
