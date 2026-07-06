import { Injectable } from '@nestjs/common';
import { winstonLogger } from './winston.config';
import chalk from 'chalk';

@Injectable()
export class LoggerService {
    log(message: string) {
        winstonLogger.info(this.format('info', message));
    }

    error(message: string, trace?: string) {
        winstonLogger.error(this.format('error', message), { stack: trace });
    }

    warn(message: string) {
        winstonLogger.warn(this.format('warn', message));
    }

    debug(message: string) {
        winstonLogger.debug(this.format('debug', message));
    }

    private format(level: string, message: string) {
        switch (level) {
            case 'info':
                return chalk.cyan(message);
            case 'warn':
                return chalk.yellow(message);
            case 'error':
                return chalk.red(message);
            case 'debug':
                return chalk.gray(message);
            default:
                return message;
        }
    }
}
