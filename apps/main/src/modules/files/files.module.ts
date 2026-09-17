import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import type { ConfigType } from '@nestjs/config';
import {
    AI_DOCUMENT_PROCESS_DLQ_ROUTING_KEY,
    AI_DOCUMENT_PROCESS_DLX,
    AI_DOCUMENT_PROCESS_QUEUE,
} from '@vention/rag-contract/constants';

import { AntivirusModule } from '~/infrastructure/antivirus/antivirus.module';
import { rabbitmqConfig } from '~/config/configuration/rabbitmq.config';
import { PrismaModule } from '~/infrastructure/database/prisma.module';
import { FileStorageModule } from '~/infrastructure/file-storage/file-storage.module';
import { FileProcessingReplyConsumer } from '~/infrastructure/messaging/file-process/file-processing-reply.consumer';
import { FileProcessingPublisher } from '~/infrastructure/messaging/file-process/file-processing.publisher';
import { RagDeletionPublisher } from '~/infrastructure/messaging/rag/rag-deletion.publisher';
import { RagProcessingPublisher } from '~/infrastructure/messaging/rag/rag-processing.publisher';
import { RagProcessingReplyConsumer } from '~/infrastructure/messaging/rag/rag-processing-reply.consumer';
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
        ClientsModule.registerAsync([
            {
                name: 'RAG_RMQ_CLIENT',
                inject: [rabbitmqConfig.KEY],
                useFactory: (config: ConfigType<typeof rabbitmqConfig>) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [
                            `amqp://${config.user}:${config.password}@${config.host}:${config.port}`,
                        ],
                        queue: AI_DOCUMENT_PROCESS_QUEUE,
                        queueOptions: {
                            durable: true,
                            arguments: {
                                'x-dead-letter-exchange':
                                    AI_DOCUMENT_PROCESS_DLX,
                                'x-dead-letter-routing-key':
                                    AI_DOCUMENT_PROCESS_DLQ_ROUTING_KEY,
                            },
                        },
                        exchange: 'ai.document',
                        exchangeType: 'topic',
                        wildcards: true,
                    },
                }),
            },
        ]),
    ],
    controllers: [FilesController],
    providers: [
        FilesService,
        FilesRepository,
        FilesGateway,
        FilesStatusNotifier,
        FileProcessingResultService,
        FileProcessingPublisher,
        FileProcessingReplyConsumer,
        RagProcessingPublisher,
        RagDeletionPublisher,
        RagProcessingReplyConsumer,
    ],
    exports: [FilesService, FilesGateway, FilesStatusNotifier],
})
export class FilesModule {}
