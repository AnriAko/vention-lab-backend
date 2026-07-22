import { getActiveOrgId } from '~/common/tenancy/organization/organization-context';

export const organizationScope = (organizationId: string) => ({
    organizations: {
        some: {
            organizationId,
        },
    },
});

export const activeTenantSoftDeleteScope = () => ({
    ...organizationScope(getActiveOrgId()),
    isDeleted: false,
});

export const activeTenantScope = () => ({
    organizationId: getActiveOrgId(),
});
