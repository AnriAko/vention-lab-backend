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

async function bootstrap(): Promise<void> {
    const logger = new Logger('FileProcess');

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
        AppModule,
        {
            transport: Transport.RMQ,
            options: {
                urls: [
                    `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`,
                ],
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

    app.enableShutdownHooks();
    await app.listen();

    logger.log('File-process microservice started');
}

bootstrap().catch((error: unknown) => {
    console.error('File-process failed to start:', error);
    process.exit(1);
});
