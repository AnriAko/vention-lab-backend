import type { SharedSyncConfig } from './copy-shared';

export const mainService: SharedSyncConfig = {
    destDir: 'src/shared',
    sharedPackages: [
        'file-process-contract',
        'rag-contract',
        'rabbitmq',
        'firebase',
        'logger',
        'file-storage',
    ],
};
