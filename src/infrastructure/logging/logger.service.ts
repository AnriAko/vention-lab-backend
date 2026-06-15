import { Injectable } from '@nestjs/common';
import { winstonLogger } from './winston.config';
// REVIEW - review it later
@Injectable()
export class LoggerService {
    log(message: string) {
        winstonLogger.info(message);
    }

    error(message: string, trace?: string) {
        winstonLogger.error(trace ? `${message}\n${trace}` : message);
    }

    warn(message: string) {
        winstonLogger.warn(message);
    }

    debug(message: string) {
        winstonLogger.debug(message);
    }
}
