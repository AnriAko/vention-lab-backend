import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import type { MicroserviceOptions } from '@nestjs/microservices';

import {
    AI_DOCUMENT_DELETE_DLQ_ROUTING_KEY,
    AI_DOCUMENT_DELETE_DLX,
    AI_DOCUMENT_DELETE_QUEUE,
    AI_DOCUMENT_PROCESS_DLQ_ROUTING_KEY,
    AI_DOCUMENT_PROCESS_DLX,
    AI_DOCUMENT_PROCESS_QUEUE,
} from '@vention/rag-contract/constants';

import { AppModule } from './app.module';

const RAG_HEALTH_QUEUE = 'ai.document.health.queue';

async function bootstrap(): Promise<void> {
    const logger = new Logger('Rag');

    const rmqUrl = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;

    const app = await NestFactory.create(AppModule);

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
            urls: [rmqUrl],
            queue: AI_DOCUMENT_PROCESS_QUEUE,
            noAck: false,
            prefetchCount: 1,
            queueOptions: {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': AI_DOCUMENT_PROCESS_DLX,
                    'x-dead-letter-routing-key':
                        AI_DOCUMENT_PROCESS_DLQ_ROUTING_KEY,
                },
            },
        },
    });

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
            urls: [rmqUrl],
            queue: RAG_HEALTH_QUEUE,
            noAck: false,
            prefetchCount: 1,
            queueOptions: {
                durable: true,
            },
        },
    });

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
            urls: [rmqUrl],
            queue: AI_DOCUMENT_DELETE_QUEUE,
            noAck: false,
            prefetchCount: 1,
            queueOptions: {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': AI_DOCUMENT_DELETE_DLX,
                    'x-dead-letter-routing-key':
                        AI_DOCUMENT_DELETE_DLQ_ROUTING_KEY,
                },
            },
        },
    });

    app.enableShutdownHooks();

    await app.init();
    await app.listen(Number(process.env.RAG_WS_PORT ?? 3002));
    await app.startAllMicroservices();

    logger.log('RAG microservice started');
}

bootstrap().catch((error: unknown) => {
    console.error('RAG failed to start:', error);
    process.exit(1);
});
