import { randomUUID } from 'node:crypto';

export const buildStoredFileName = (extension: string): string => {
    const safeExtension = extension.startsWith('.')
        ? extension.toLowerCase()
        : `.${extension.toLowerCase()}`;

    return `${randomUUID()}${safeExtension}`;
};
