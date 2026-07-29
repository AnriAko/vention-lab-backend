import { createHash } from 'node:crypto';

import { FileStatus, PrismaClient } from '../../src/generated/prisma/client';
import { faker } from '@faker-js/faker';

import {
    SEED_FILES,
    SEED_ORGANIZATIONS,
    SEED_USERS,
} from '../../src/common/api/swagger/seed-examples';
import {
    getFirebaseStorageBucket,
    initializeFirebaseAdmin,
} from '../../src/infrastructure/file-storage/firebase-admin.app';
import { loadPrismaEnv } from '../../src/config/prisma/prisma-env';

const TOTAL_FILES = 200;
const BATCH_SIZE = 100;

function initializeSeedFirebaseStorage() {
    loadPrismaEnv();

    initializeFirebaseAdmin({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
        serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH!,
    });

    return getFirebaseStorageBucket();
}

async function seedOwnerExampleFiles(prisma: PrismaClient) {
    const bucket = initializeSeedFirebaseStorage();

    for (const file of Object.values(SEED_FILES)) {
        const content = Buffer.from(`seed-file:${file.id}:${file.name}\n`);
        const checksum = createHash('sha256').update(content).digest('hex');

        await bucket.file(file.storageKey).save(content);

        await prisma.file.create({
            data: {
                id: file.id,
                ownerId: file.ownerId,
                organizationId: file.organizationId,
                name: file.name,
                size: content.length,
                status: FileStatus.PROCESSED,
                contentType: file.contentType,
                checksum,
                storageKey: file.storageKey,
                processingError: null,
            },
        });
    }

    console.log(
        `  Owner example files: ${SEED_FILES.ownerSalesReport.name} (${SEED_FILES.ownerSalesReport.id}), ${SEED_FILES.ownerTeamBudget.name} (${SEED_FILES.ownerTeamBudget.id})`
    );
    console.log(
        `  Use CatFans org header: ${SEED_ORGANIZATIONS.catFans.id} with owner ${SEED_USERS.owner.email}`
    );
}

export async function seedFiles(prisma: PrismaClient) {
    await seedOwnerExampleFiles(prisma);

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
        name: string;
        size: number;
        status: FileStatus;
        contentType: string;
        storageKey: string;
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
            name: faker.system.commonFileName('xlsx'),
            size: faker.number.int({
                min: 1000,
                max: 5_000_000,
            }),
            status: FileStatus.PROCESSED,
            contentType:
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            storageKey: `${faker.string.uuid()}.xlsx`,
            processingError: null,
        });

        if (filesBatch.length >= BATCH_SIZE) {
            await flush();
        }
    }

    await flush();

    console.log('Files seeded');
}
