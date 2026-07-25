import { Module } from '@nestjs/common';

import { PrismaModule } from '~/infrastructure/database/prisma.module';
import { FileStorageService } from './file-storage.service';
import { FilesController } from './files.controller';
import { FilesRepository } from './files.repository';
import { FilesService } from './files.service';

@Module({
    imports: [PrismaModule],
    controllers: [FilesController],
    providers: [FilesService, FilesRepository, FileStorageService],
    exports: [FilesService],
})
export class FilesModule {}
