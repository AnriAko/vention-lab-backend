import type { OrganizationRole } from '~/generated/prisma/enums';

export type OrganizationMember = {
    id: string;
    email: string;
    name: string;
    role: OrganizationRole;
};
