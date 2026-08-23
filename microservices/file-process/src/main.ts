import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

import { AppModule } from './app.module';

async function bootstrap() {
    const logger = new Logger('FileProcess');
    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn', 'log'],
    });
    app.enableShutdownHooks();
    logger.log('Worker started');
}

bootstrap().catch((error: unknown) => {
    console.error('Worker failed to start:', error);
    process.exit(1);
});
