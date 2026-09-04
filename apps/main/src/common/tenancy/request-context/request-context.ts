import { AsyncLocalStorage } from 'node:async_hooks';

import type { RequestContext } from './request-context.types';

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext {
    const context = requestContext.getStore();

    if (!context) {
        throw new Error('Missing request context');
    }

    return context;
}
