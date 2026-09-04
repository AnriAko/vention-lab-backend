import { getActiveOrgId } from '~/common/tenancy/organization/organization-context';

export const organizationUserScope = () => ({
    organizations: {
        some: {
            organizationId: getActiveOrgId(),
            isDeleted: false,
        },
    },
});

export const deletedOrganizationUserScope = () => ({
    organizations: {
        some: {
            organizationId: getActiveOrgId(),
            isDeleted: true,
        },
    },
});
