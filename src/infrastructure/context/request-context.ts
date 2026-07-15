import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContext = {
    requestId: string;
    startTime: number;
    userId: string;
    organizationId?: string;
    role?: string;
};

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function setRequestUser(userId: string) {
    const store = requestContext.getStore();

    if (!store) return;

    store.userId = userId ?? 'anonymous';
}

export function setRequestOrganization(organizationId: string) {
    const store = requestContext.getStore();

    if (!store) return;

    store.organizationId = organizationId;
}
