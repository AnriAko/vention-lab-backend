import * as winston from 'winston';

export const winstonLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf((info) => {
            const timestamp = String(info.timestamp);
            const level = String(info.level);
            const message = String(info.message);

            return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
        new winston.transports.File({
            filename: 'logs/all.log',
        }),
        new winston.transports.File({
            filename: 'logs/errors.log',
            level: 'error',
        }),
    ],
});
