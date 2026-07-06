import { PrismaClient } from '../../src/generated/prisma/client';

const ORGANIZATIONS = ['CatFans', 'DogFans', 'BirdFans'];

export async function seedOrganizations(prisma: PrismaClient) {
    await prisma.organization.createMany({
        data: ORGANIZATIONS.map((name) => ({ name })),
    });

    return prisma.organization.findMany();
}
