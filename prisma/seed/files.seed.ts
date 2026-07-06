import { PrismaClient, User } from '../../src/generated/prisma/client';
import { faker } from '@faker-js/faker';

export async function seedFiles(prisma: PrismaClient, users: User[]) {
    const filesData: {
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

    const relations = await prisma.usersOrganizations.findMany();

    const userOrgMap = new Map<string, string[]>();

    for (const r of relations) {
        if (!userOrgMap.has(r.userId)) {
            userOrgMap.set(r.userId, []);
        }
        userOrgMap.get(r.userId)!.push(r.organizationId);
    }

    for (const user of users) {
        const orgIds = userOrgMap.get(user.id) || [];

        for (const orgId of orgIds) {
            const count = faker.number.int({ min: 1, max: 5 });

            for (let i = 0; i < count; i++) {
                filesData.push({
                    ownerId: user.id,
                    organizationId: orgId,
                    filename: faker.system.fileName(),
                    size: faker.number.int({ min: 1000, max: 5_000_000 }),
                    status: 'READY',
                    contentType: 'application/octet-stream',
                    storageKey: faker.string.uuid(),
                    application: null,
                    processingError: null,
                });
            }
        }
    }

    await prisma.file.createMany({
        data: filesData,
    });

    console.log('Files seeded');
}
