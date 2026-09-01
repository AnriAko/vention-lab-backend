import { Inject, Injectable } from '@nestjs/common';
import type winston from 'winston';

import { LOGGER_OPTIONS, type LoggerOptions } from './logger.types';
import { createWinstonLogger } from './winston.logger';

type LogInput =
    | string
    | {
          message: string;
          [key: string]: any;
      };

@Injectable()
export class LoggerService {
    private readonly winstonLogger: winston.Logger;

    constructor(
        @Inject(LOGGER_OPTIONS)
        private readonly options: LoggerOptions
    ) {
        this.winstonLogger = createWinstonLogger(options);
    }

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
        const base = this.normalize(input);

        return {
            service: this.options.serviceName,
            ...this.options.enrich?.(),
            ...base,
            timestamp: new Date().toISOString(),
        };
    }

    log(input: LogInput) {
        this.winstonLogger.info(this.enrich(input));
    }

    info(input: LogInput) {
        this.log(input);
    }

    debug(input: LogInput) {
        this.winstonLogger.debug(this.enrich(input));
    }

    warn(input: LogInput) {
        this.winstonLogger.warn(this.enrich(input));
    }

    error(input: LogInput, trace?: string) {
        this.winstonLogger.error({
            ...this.enrich(input),
            stack: trace || undefined,
        });
    }
}
