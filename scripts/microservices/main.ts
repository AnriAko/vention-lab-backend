import type { SharedSyncConfig } from './copy-shared';

export const mainService: SharedSyncConfig = {
    destDir: 'src/shared',
    sharedPackages: [
        'file-processing',
        'rabbitmq',
        'firebase',
        'logger',
        'file-storage',
    ],
};
