import type { SharedSyncConfig } from './copy-shared';

export const fileProcess: SharedSyncConfig = {
    destDir: 'microservices/file-process/src/shared',
    sharedPackages: [
        'file-process-contract',
        'rabbitmq',
        'firebase',
        'logger',
        'file-storage',
    ],
};
