export const AppRole = {
    AUTHENTICATED_USER: 'AUTHENTICATED_USER',
    USER: 'USER',
    ADMIN: 'ADMIN',
    OWNER: 'OWNER',
} as const;

export type AppRole = (typeof AppRole)[keyof typeof AppRole];
