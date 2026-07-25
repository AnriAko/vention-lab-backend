import { faker } from '@faker-js/faker';
import argon2 from 'argon2';

import {
    Organization,
    OrganizationRole,
    PrismaClient,
} from '../../src/generated/prisma/client';
import {
    SEED_ORGANIZATIONS,
    SEED_PASSWORD,
    SEED_USERS,
} from '../../src/common/api/swagger/seed-examples';

const TOTAL_USERS = 10_000;
const BATCH_SIZE = 5000;

function slugifyOrganizationName(name: string): string {
    return name.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function orgSeedByName(name: string) {
    return Object.values(SEED_ORGANIZATIONS).find(
        (organization) => organization.name === name
    );
}

export async function seedUsers(
    prisma: PrismaClient,
    organizations: Organization[]
) {
    const hashedPassword = await argon2.hash(SEED_PASSWORD);

    await prisma.user.create({
        data: {
            id: SEED_USERS.owner.id,
            name: SEED_USERS.owner.name,
            email: SEED_USERS.owner.email,
            password: hashedPassword,
        },
    });

    await prisma.owner.create({
        data: {
            userId: SEED_USERS.owner.id,
        },
    });

    await prisma.usersOrganizations.createMany({
        data: organizations.map((organization) => ({
            userId: SEED_USERS.owner.id,
            organizationId: organization.id,
        })),
    });

    await prisma.usersOrganizationsRoles.createMany({
        data: organizations.map((organization) => ({
            userId: SEED_USERS.owner.id,
            organizationId: organization.id,
            role: OrganizationRole.ADMIN,
        })),
    });

    for (const organization of organizations) {
        const orgSeed = orgSeedByName(organization.name);
        const adminId = orgSeed?.adminId ?? crypto.randomUUID();
        const adminEmail =
            orgSeed?.adminEmail ??
            `admin.${slugifyOrganizationName(organization.name)}@example.com`;
        const adminName = orgSeed?.adminName ?? `${organization.name} Admin`;

        await prisma.user.create({
            data: {
                id: adminId,
                name: adminName,
                email: adminEmail,
                password: hashedPassword,
            },
        });

        await prisma.usersOrganizations.create({
            data: {
                userId: adminId,
                organizationId: organization.id,
            },
        });

        await prisma.usersOrganizationsRoles.create({
            data: {
                userId: adminId,
                organizationId: organization.id,
                role: OrganizationRole.ADMIN,
            },
        });
    }

    await prisma.user.create({
        data: {
            id: SEED_USERS.demoMember.id,
            name: SEED_USERS.demoMember.name,
            email: SEED_USERS.demoMember.email,
            password: hashedPassword,
            image: faker.image.avatar(),
        },
    });

    await prisma.usersOrganizations.create({
        data: {
            userId: SEED_USERS.demoMember.id,
            organizationId: SEED_ORGANIZATIONS.catFans.id,
        },
    });

    await prisma.usersOrganizationsRoles.create({
        data: {
            userId: SEED_USERS.demoMember.id,
            organizationId: SEED_ORGANIZATIONS.catFans.id,
            role: OrganizationRole.USER,
        },
    });

    let usersBatch: {
        id: string;
        name: string;
        email: string;
        password: string;
        image: string;
    }[] = [];

    let membershipBatch: {
        userId: string;
        organizationId: string;
    }[] = [];

    let rolesBatch: {
        userId: string;
        organizationId: string;
        role: OrganizationRole;
    }[] = [];

    let userIndex = 2;

    const flush = async () => {
        if (!usersBatch.length) {
            return;
        }

        await prisma.user.createMany({
            data: usersBatch,
        });

        await prisma.usersOrganizations.createMany({
            data: membershipBatch,
        });

        await prisma.usersOrganizationsRoles.createMany({
            data: rolesBatch,
        });

        usersBatch = [];
        membershipBatch = [];
        rolesBatch = [];
    };

    const remainingUsers = TOTAL_USERS - 1;
    const usersPerOrg = Math.floor(remainingUsers / organizations.length);
    const remainder = remainingUsers % organizations.length;

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
                image: faker.image.avatar(),
            });

            membershipBatch.push({
                userId,
                organizationId: organization.id,
            });

            rolesBatch.push({
                userId,
                organizationId: organization.id,
                role: OrganizationRole.USER,
            });

            userIndex++;

            if (usersBatch.length >= BATCH_SIZE) {
                await flush();
            }
        }
    }

    await flush();

    console.log('Users seeded');
    console.log(`  Owner: ${SEED_USERS.owner.email} / ${SEED_PASSWORD}`);
    for (const organization of organizations) {
        const orgSeed = orgSeedByName(organization.name);
        console.log(
            `  Admin (${organization.name}): ${orgSeed?.adminEmail ?? `admin.${slugifyOrganizationName(organization.name)}@example.com`} / ${SEED_PASSWORD}`
        );
    }
    console.log(
        `  Demo member: ${SEED_USERS.demoMember.email} / ${SEED_PASSWORD} (id=${SEED_USERS.demoMember.id})`
    );
}
