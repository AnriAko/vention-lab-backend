import { Module } from '@nestjs/common';

import { AntivirusModule } from '~/infrastructure/antivirus/antivirus.module';
import { PrismaModule } from '~/infrastructure/database/prisma.module';
import { FileStorageModule } from '~/infrastructure/file-storage/file-storage.module';
import { LoggerModule } from '~/infrastructure/logging/logger.module';
import { FileProcessingReplyConsumer } from '~/infrastructure/messaging/file-processing/file-processing-reply.consumer';
import { RabbitmqModule } from '~/infrastructure/messaging/rabbitmq.module';
import { FileProcessingResultService } from './file-processing-result.service';
import { FilesController } from './files.controller';
import { FilesGateway } from './files.gateway';
import { FilesRepository } from './files.repository';
import { FilesService } from './files.service';
import { FilesStatusNotifier } from './files-status.notifier';

@Module({
    imports: [
        PrismaModule,
        FileStorageModule,
        AntivirusModule,
        RabbitmqModule,
        LoggerModule,
    ],
    controllers: [FilesController],
    providers: [
        FilesService,
        FilesRepository,
        FilesGateway,
        FilesStatusNotifier,
        FileProcessingResultService,
        FileProcessingReplyConsumer,
    ],
    exports: [FilesService, FilesGateway, FilesStatusNotifier],
})
export class FilesModule {}
