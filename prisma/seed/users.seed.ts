import { faker } from '@faker-js/faker';
import argon2 from 'argon2';

import {
    Organization,
    PrismaClient,
    UserRole,
} from '../../src/generated/prisma/client';

const DEFAULT_PASSWORD = 'Password123!';
const TOTAL_USERS = 10_000;
const BATCH_SIZE = 5000;

export async function seedUsers(
    prisma: PrismaClient,
    organizations: Organization[]
) {
    const hashedPassword = await argon2.hash(DEFAULT_PASSWORD);

    const ownerId = crypto.randomUUID();

    await prisma.user.create({
        data: {
            id: ownerId,
            name: 'Super Owner',
            email: 'owner@example.com',
            password: hashedPassword,
            role: UserRole.OWNER,
        },
    });

    await prisma.usersOrganizations.createMany({
        data: organizations.map((organization) => ({
            userId: ownerId,
            organizationId: organization.id,
        })),
    });

    for (const organization of organizations) {
        const adminId = crypto.randomUUID();

        await prisma.user.create({
            data: {
                id: adminId,
                name: `${organization.name} Admin`,
                email: `admin.${organization.name.toLowerCase()}@example.com`,
                password: hashedPassword,
                role: UserRole.ADMIN,
            },
        });

        await prisma.usersOrganizations.create({
            data: {
                userId: adminId,
                organizationId: organization.id,
            },
        });
    }

    let usersBatch: {
        id: string;
        name: string;
        email: string;
        password: string;
        role: UserRole;
    }[] = [];

    let relationsBatch: {
        userId: string;
        organizationId: string;
    }[] = [];

    let userIndex = 1;

    const flush = async () => {
        if (!usersBatch.length) {
            return;
        }

        await prisma.user.createMany({
            data: usersBatch,
        });

        await prisma.usersOrganizations.createMany({
            data: relationsBatch,
        });

        usersBatch = [];
        relationsBatch = [];
    };

    const usersPerOrg = Math.floor(TOTAL_USERS / organizations.length);
    const remainder = TOTAL_USERS % organizations.length;

    for (let orgIndex = 0; orgIndex < organizations.length; orgIndex++) {
        const organization = organizations[orgIndex];

        const count = usersPerOrg + (orgIndex < remainder ? 1 : 0);

        for (let i = 0; i < count; i++) {
            const userId = crypto.randomUUID();

            usersBatch.push({
                id: userId,
                name: faker.person.fullName(),
                email: `user${userIndex}@example.com`,
                password: hashedPassword,
                role: UserRole.USER,
            });

            relationsBatch.push({
                userId,
                organizationId: organization.id,
            });

            userIndex++;

            if (usersBatch.length >= BATCH_SIZE) {
                await flush();
            }
        }
    }

    await flush();
}
