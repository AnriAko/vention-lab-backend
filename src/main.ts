import { cleanupOpenApiDoc } from 'nestjs-zod';
import {
    SwaggerModule,
    DocumentBuilder,
    type OpenAPIObject,
} from '@nestjs/swagger';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

import chalk from 'chalk';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api');

    const openApiDoc: OpenAPIObject = SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
            .setTitle('Example API')
            .setDescription('Example API description')
            .setVersion('1.0')
            .build()
    );

    SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(openApiDoc));
    app.use(cookieParser());

    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT') ?? 3000;

    await app.listen(port);

    console.log(
        chalk.green('[System]') +
            ' ' +
            chalk.white(`Server is running on http://localhost:${port}`)
    );

    console.log(
        chalk.green('[System]') +
            ' ' +
            chalk.white(`Swagger docs: http://localhost:${port}/api/docs`)
    );
}

bootstrap().catch((err) => {
    console.error(chalk.red('Application failed to start:'));
    console.error(err);
    process.exit(1);
});
