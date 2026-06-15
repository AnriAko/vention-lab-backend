import { cleanupOpenApiDoc } from 'nestjs-zod';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const openApiDoc: OpenAPIObject = SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
            .setTitle('Example API')
            .setDescription('Example API description')
            .setVersion('1.0')
            .build()
    );

    SwaggerModule.setup('api', app, cleanupOpenApiDoc(openApiDoc));

    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT') ?? 3000;

    await app.listen(port);
}
bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
});
