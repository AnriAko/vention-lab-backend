import type { SharedSyncConfig } from './copy-shared';

export const rag: SharedSyncConfig = {
    destDir: 'microservices/rag/src/shared',
    sharedPackages: [
        'rag-contract',
        'rabbitmq',
        'qdrant',
        'firebase',
        'logger',
        'file-storage',
    ],
};
