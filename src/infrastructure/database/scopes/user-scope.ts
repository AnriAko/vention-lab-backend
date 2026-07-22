import { getActiveOrgId } from '~/common/tenancy/organization/organization-context';

export const activeUserScope = () => ({
    isDeleted: false,
});

export const organizationUserScope = () => ({
    isDeleted: false,

    organizations: {
        some: {
            organizationId: getActiveOrgId(),
        },
    },
});

export const deletedOrganizationUserScope = () => ({
    isDeleted: true,

    organizations: {
        some: {
            organizationId: getActiveOrgId(),
        },
    },
});
