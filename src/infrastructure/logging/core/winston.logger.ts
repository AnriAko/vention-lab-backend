import * as winston from 'winston';
import { consoleFormat } from '~/infrastructure/logging/formatters/console.formatter';
import { fileFormat } from '~/infrastructure/logging/formatters/file.formatter';

export const winstonLogger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console({
            format: consoleFormat,
        }),
        new winston.transports.File({
            filename: 'logs/all.log',
            format: fileFormat,
        }),
        new winston.transports.File({
            filename: 'logs/errors.log',
            level: 'error',
            format: fileFormat,
        }),
    ],
});
