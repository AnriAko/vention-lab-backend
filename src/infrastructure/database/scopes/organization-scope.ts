import { getActiveOrgId } from '~/infrastructure/context/organization/organization-context';

export const organizationScope = (organizationId: string) => ({
    organizations: {
        some: {
            organizationId,
        },
    },
});

export const activeOrganizationScope = () => ({
    ...organizationScope(getActiveOrgId()),
    isDeleted: false,
});
