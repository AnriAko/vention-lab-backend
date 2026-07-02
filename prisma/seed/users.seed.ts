import argon2 from 'argon2';

import {
    Organization,
    PrismaClient,
    UserRole,
} from '../../src/generated/prisma/client';

const DEFAULT_PASSWORD = 'Password123!';

export async function seedUsers(
    prisma: PrismaClient,
    organizations: Organization[]
) {
    const hashedPassword = await argon2.hash(DEFAULT_PASSWORD);

    const usersData: any[] = [];
    const relationsData: any[] = [];

    const ownerId = crypto.randomUUID();

    usersData.push({
        id: ownerId,
        name: 'Super Owner',
        email: 'owner@example.com',
        password: hashedPassword,
        role: UserRole.OWNER,
    });

    for (const org of organizations) {
        relationsData.push({
            userId: ownerId,
            organizationId: org.id,
        });
    }

    for (const organization of organizations) {
        const adminId = crypto.randomUUID();

        usersData.push({
            id: adminId,
            name: `${organization.name} Admin`,
            email: `admin.${organization.name.toLowerCase()}@example.com`,
            password: hashedPassword,
            role: UserRole.ADMIN,
        });

        relationsData.push({
            userId: adminId,
            organizationId: organization.id,
        });

        for (let i = 0; i < 5; i++) {
            const userId = crypto.randomUUID();

            usersData.push({
                id: userId,
                name: `User ${i + 1}`,
                email: `user${i + 1}.${organization.name.toLowerCase()}@example.com`,
                password: hashedPassword,
                role: UserRole.USER,
            });

            relationsData.push({
                userId,
                organizationId: organization.id,
            });
        }
    }

    await prisma.user.createMany({
        data: usersData,
    });

    await prisma.usersOrganizations.createMany({
        data: relationsData,
    });

    return prisma.user.findMany();
}
