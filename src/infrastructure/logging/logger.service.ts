import { Injectable } from '@nestjs/common';
import { winstonLogger } from './core/winston.logger';
import { requestContext } from '../context/request-context';

type LogInput =
    | string
    | {
          message: string;
          [key: string]: any;
      };

@Injectable()
export class LoggerService {
    private normalize(input: LogInput) {
        if (typeof input === 'string') {
            return { message: input };
        }

        const { message, ...meta } = input;

        return {
            message,
            ...meta,
        };
    }

    private enrich(input: LogInput) {
        const ctx = requestContext.getStore();
        const base = this.normalize(input);

        return {
            ...base,
            requestId: ctx?.requestId ?? 'no-req',
            userId: ctx?.userId ?? 'anonymous',
            timestamp: new Date().toISOString(),
        };
    }

    log(input: LogInput) {
        winstonLogger.info(this.enrich(input));
    }

    debug(input: LogInput) {
        winstonLogger.debug(this.enrich(input));
    }

    warn(input: LogInput) {
        winstonLogger.warn(this.enrich(input));
    }

    error(input: LogInput, trace?: string) {
        winstonLogger.error({
            ...this.enrich(input),
            stack: trace || undefined,
        });
    }
}
