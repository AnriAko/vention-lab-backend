import { PrismaClient } from '../../src/generated/prisma/client';

import { SEED_ORGANIZATIONS } from '../../src/common/api/swagger/seed-examples';

const ORGANIZATIONS = Object.values(SEED_ORGANIZATIONS);

export async function seedOrganizations(prisma: PrismaClient) {
    await prisma.organization.createMany({
        data: ORGANIZATIONS.map((organization) => ({
            id: organization.id,
            name: organization.name,
        })),
    });

    return prisma.organization.findMany({
        orderBy: { name: 'asc' },
    });
}
