export const organizationMemberSelect = (organizationId: string) =>
    ({
        id: true,
        email: true,
        name: true,
        organizationRoles: {
            where: { organizationId },
            select: { role: true },
            take: 1,
        },
    }) as const;
