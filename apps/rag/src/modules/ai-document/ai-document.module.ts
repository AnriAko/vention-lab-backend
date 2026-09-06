import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { ChunkingModule } from '~/infrastructure/chunking/chunking.module';
import { EmbeddingModule } from '~/infrastructure/embedding/embedding.module';
import { ParsingModule } from '~/infrastructure/parsing/parsing.module';
import { QdrantDocumentsModule } from '~/infrastructure/qdrant/qdrant.module';
import { rabbitmqConfig } from '~/config/configuration/rabbitmq.config';
import { FileStorageModule } from '@vention/shared-file-storage';

import { AiDocumentController } from './ai-document.controller';
import { AiDocumentService } from './ai-document.service';

@Module({
    imports: [
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
                        queue: 'ai.document.process.queue',
                        exchange: 'ai.document',
                        exchangeType: 'topic',
                        wildcards: true,
                    },
                }),
            },
        ]),
        FileStorageModule,
        ParsingModule,
        ChunkingModule,
        EmbeddingModule,
        QdrantDocumentsModule,
    ],
    controllers: [AiDocumentController],
    providers: [AiDocumentService],
})
export class AiDocumentModule {}
