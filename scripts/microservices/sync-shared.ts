import { syncSharedTarget } from './copy-shared';
import { fileProcess } from './file-process';
import { mainService } from './main';
import type { SharedSyncConfig } from './copy-shared';

const configs: SharedSyncConfig[] = [mainService, fileProcess];

function main(): void {
    if (configs.length === 0) {
        console.log('No shared sync configs registered.');
        return;
    }

    for (const config of configs) {
        syncSharedTarget(config);
    }
}

main();
