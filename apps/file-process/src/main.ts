import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import type { MicroserviceOptions } from '@nestjs/microservices';

import {
    FILE_PROCESS_DLQ_ROUTING_KEY,
    FILE_PROCESS_DLX,
    FILE_PROCESS_QUEUE,
} from '@vention/file-process-contract/constants';

import { AppModule } from './app.module';
import { FileProcessRmqDeserializer } from './modules/file-process/file-process.rmq-deserializer';

const FILE_PROCESS_HEALTH_QUEUE = 'file.process.health.queue';

async function bootstrap(): Promise<void> {
    const logger = new Logger('FileProcess');
    const rmqUrl = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
        AppModule,
        {
            transport: Transport.RMQ,
            options: {
                urls: [rmqUrl],
                queue: FILE_PROCESS_QUEUE,
                noAck: false,
                prefetchCount: 1,
                deserializer: new FileProcessRmqDeserializer(),
                queueOptions: {
                    durable: true,
                    arguments: {
                        'x-dead-letter-exchange': FILE_PROCESS_DLX,
                        'x-dead-letter-routing-key':
                            FILE_PROCESS_DLQ_ROUTING_KEY,
                    },
                },
            },
        }
    );

    const healthApp = await NestFactory.createMicroservice<MicroserviceOptions>(
        AppModule,
        {
            transport: Transport.RMQ,
            options: {
                urls: [rmqUrl],
                queue: FILE_PROCESS_HEALTH_QUEUE,
                noAck: true,
                prefetchCount: 1,
                deserializer: new FileProcessRmqDeserializer(),
                queueOptions: {
                    durable: true,
                },
            },
        }
    );

    app.enableShutdownHooks();
    healthApp.enableShutdownHooks();
    await app.listen();
    await healthApp.listen();

    logger.log('File-process microservice started');
}

bootstrap().catch((error: unknown) => {
    console.error('File-process failed to start:', error);
    process.exit(1);
});
