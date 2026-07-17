export const AppRole = {
    USER: 'USER',
    ADMIN: 'ADMIN',
    OWNER: 'OWNER',
} as const;

export type AppRole = (typeof AppRole)[keyof typeof AppRole];
