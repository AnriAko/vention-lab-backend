import type { SharedSyncConfig } from './copy-shared';

export const fileProcess: SharedSyncConfig = {
    destDir: 'microservices/file-process/src/shared',
    sharedPackages: [
        'file-processing',
        'rabbitmq',
        'qdrant',
        'firebase',
        'logger',
        'file-storage',
    ],
};
