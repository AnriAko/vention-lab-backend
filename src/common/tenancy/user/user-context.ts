import { requestContext } from '../request-context/request-context';
import { AUTH_GUEST, type AppRole } from '~/common/security';

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
