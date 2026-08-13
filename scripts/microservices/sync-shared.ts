import { copyShared } from './copy-shared';
import { fileProcess } from './file-process';
import type { MicroserviceSharedSyncConfig } from './copy-shared';

const configs: MicroserviceSharedSyncConfig[] = [fileProcess];

function syncMicroservice(config: MicroserviceSharedSyncConfig): void {
    for (const sharedPackage of config.sharedPackages) {
        copyShared({
            sharedPackage,
            microservice: config.microservice,
        });
    }
}

function main(): void {
    if (configs.length === 0) {
        console.log('No microservice shared sync configs registered.');
        return;
    }

    for (const config of configs) {
        syncMicroservice(config);
    }
}

main();
