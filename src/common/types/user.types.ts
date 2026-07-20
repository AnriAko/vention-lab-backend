export const userSelectSafe = {
    id: true,
    email: true,
    name: true,
    image: true,
    isDeleted: true,
    createdAt: true,
    updatedAt: true,
} as const;

export type UserSafe = {
    id: string;
    email: string;
    name: string;
    image: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export type UserCursor = {
    createdAt: Date;
    id: string;
};
