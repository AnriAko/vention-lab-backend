import { Module } from '@nestjs/common';

import { FileStorageModule as SharedFileStorageModule } from '@vention/shared-file-storage';

import { FileStorageService } from './file-storage.service';

@Module({
    imports: [SharedFileStorageModule],
    providers: [FileStorageService],
    exports: [FileStorageService],
})
export class FileStorageModule {}
