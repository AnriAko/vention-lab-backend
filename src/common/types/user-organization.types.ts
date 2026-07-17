import type { OrganizationRole } from '~/generated/prisma/enums';

export type UserOrganization = {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    role: OrganizationRole;
};
