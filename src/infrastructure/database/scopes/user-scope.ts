import { getActiveOrgId } from '~/common/tenancy';

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
