import { requestContext } from '../request/request-context';

export const getActiveOrgId = (): string => {
    const organizationId = requestContext.getStore()?.organizationId;

    if (!organizationId) {
        throw new Error('Missing organization context');
    }

    return organizationId;
};

export const setRequestOrganization = (organizationId: string): void => {
    const store = requestContext.getStore();

    if (!store) return;

    store.organizationId = organizationId;
};
