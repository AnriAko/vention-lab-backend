import winston from 'winston';

export const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);
