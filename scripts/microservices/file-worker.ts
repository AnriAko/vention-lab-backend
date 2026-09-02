import type { SharedSyncConfig } from './copy-shared';

export const fileWorker: SharedSyncConfig = {
    destDir: 'microservices/file-worker/src/shared',
    sharedPackages: [
        'file-worker-contract',
        'rabbitmq',
        'qdrant',
        'firebase',
        'logger',
        'file-storage',
    ],
};
