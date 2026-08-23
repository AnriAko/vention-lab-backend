import type { MicroserviceSharedSyncConfig } from './copy-shared';

export const fileProcess: MicroserviceSharedSyncConfig = {
    microservice: 'file-process',
    sharedPackages: ['file-processing', 'rabbitmq'],
};
