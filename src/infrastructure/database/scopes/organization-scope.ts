import { getActiveOrgId } from '~/common/tenancy';

export const organizationScope = (organizationId: string) => ({
    organizations: {
        some: {
            organizationId,
            isDeleted: false,
        },
    },
});

export const activeTenantSoftDeleteScope = () =>
    organizationScope(getActiveOrgId());

export const deletedTenantMembershipScope = () => ({
    organizations: {
        some: {
            organizationId: getActiveOrgId(),
            isDeleted: true,
        },
    },
});

export const activeTenantScope = () => ({
    organizationId: getActiveOrgId(),
});
