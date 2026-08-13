import { Module } from '@nestjs/common';

import { PrismaModule } from '~/infrastructure/database/prisma.module';
import { FileStorageModule } from '~/infrastructure/file-storage/file-storage.module';
import { FilesController } from './files.controller';
import { FilesRepository } from './files.repository';
import { FilesService } from './files.service';

@Module({
    imports: [PrismaModule, FileStorageModule],
    controllers: [FilesController],
    providers: [FilesService, FilesRepository],
    exports: [FilesService],
})
export class FilesModule {}
