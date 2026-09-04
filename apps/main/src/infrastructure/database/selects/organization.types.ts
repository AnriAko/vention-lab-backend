export const organizationSelectSafe = {
    id: true,
    name: true,
    createdAt: true,
    updatedAt: true,
    isDeleted: true,
} as const;

export type OrganizationSafe = {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
};
