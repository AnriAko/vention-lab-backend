import winston from 'winston';
import chalk from 'chalk';

const shortId = (id?: string) => {
    if (!id) return '[no-req]';
    return `[${id.slice(0, 8)}]`;
};

const levelColor = (level: string) => {
    switch (level) {
        case 'error':
            return chalk.red;
        case 'warn':
            return chalk.yellow;
        default:
            return chalk.green;
    }
};

const formatMessage = (msg: string, color: (s: string) => string) => {
    let text = msg.replace(/\b(\d+)\.\d+\b/g, '$1');

    text = text.replace(/\[([^\]]+)\]/g, (_, v) => color(`[${v}]`));

    text = text.replace(/\b\d+ms\b/g, (v) => chalk.yellow(v));

    text = text.replace(/\b\d+\b/g, (n) => color(n));

    return text;
};

export const consoleFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf((info: any) => {
        const time = new Date(info.timestamp).toLocaleTimeString('en-GB', {
            hour12: false,
        });

        const color = levelColor(info.level);

        const message = formatMessage(String(info.message), color);

        const userId = info.userId
            ? chalk.cyan(`[user=${info.userId.slice(0, 8)}]`)
            : chalk.gray('[anonymous]');

        const sql = info.sql
            ? ` ${chalk.gray('|')} ${chalk.white(info.sql)}`
            : '';

        return `${color(`[${info.level.toUpperCase()}]`)} ${chalk.gray(
            `[${time}]`
        )} - ${chalk.gray(shortId(info.requestId))} ${userId} ${chalk.white(message)}${sql}`;
    })
);
