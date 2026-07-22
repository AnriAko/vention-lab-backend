import { requestContext } from '../request/request-context';
import { AUTH_GUEST } from '~/common/types/auth.types';
import type { AppRole } from '~/common/types/app-role.enum';

export const setRequestUser = (userId: string) => {
    const store = requestContext.getStore();

    if (!store) return;

    store.userId = userId ?? AUTH_GUEST;
};

export const setRequestRole = (role: AppRole) => {
    const store = requestContext.getStore();

    if (!store) return;

    store.role = role;
};
