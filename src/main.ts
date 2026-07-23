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
import helmet from 'helmet';

import chalk from 'chalk';

import {
    SWAGGER_API_DESCRIPTION,
    SWAGGER_AUTH,
} from '~/common/api/swagger/swagger.constants';
import { AUTH_HEADER } from '~/common/security/auth.types';
import { AuthCookie } from '~/common/security/auth.constants';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api');

    app.use(helmet());
    app.use(cookieParser());

    const openApiDoc: OpenAPIObject = SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
            .setTitle('Vention Lab API')
            .setDescription(SWAGGER_API_DESCRIPTION)
            .setVersion('1.0')
            .addBearerAuth(
                {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description:
                        'Access token from `POST /api/auth/login` (`data.accessToken`).',
                },
                SWAGGER_AUTH.ACCESS_TOKEN
            )
            .addApiKey(
                {
                    type: 'apiKey',
                    in: 'header',
                    name: AUTH_HEADER.ORGANIZATION_ID,
                    description:
                        'Required on tenant routes (not for `@PublicRoute` / `@SkipOrganization`).',
                },
                SWAGGER_AUTH.ORGANIZATION_ID
            )
            .addApiKey(
                {
                    type: 'apiKey',
                    in: 'header',
                    name: AUTH_HEADER.ORGANIZATION_ROLE,
                    description:
                        'Organization role context hint (`USER` | `ADMIN`). Required on tenant routes; verified against the database.',
                },
                SWAGGER_AUTH.ORGANIZATION_ROLE
            )
            .addCookieAuth(
                AuthCookie.REFRESH_TOKEN,
                {
                    type: 'apiKey',
                    in: 'cookie',
                    name: AuthCookie.REFRESH_TOKEN,
                    description:
                        'HttpOnly refresh cookie set by login. Used by `POST /api/auth/refresh`.',
                },
                SWAGGER_AUTH.REFRESH_TOKEN
            )
            .build()
    );

    SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(openApiDoc));

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
