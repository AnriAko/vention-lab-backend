import winston from 'winston';

import { consoleFormat } from './formatters/console.formatter';
import { fileFormat } from './formatters/file.formatter';
import type { LoggerOptions } from './logger.types';

export function createWinstonLogger(options: LoggerOptions): winston.Logger {
    return winston.createLogger({
        level: options.level ?? 'info',
        defaultMeta: {
            service: options.serviceName,
        },
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
}
