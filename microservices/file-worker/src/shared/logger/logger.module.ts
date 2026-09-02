import { type DynamicModule, Module } from '@nestjs/common';

import { LoggerService } from './logger.service';
import { LOGGER_OPTIONS, type LoggerOptions } from './logger.types';

@Module({})
export class LoggerModule {
    static forRoot(options: LoggerOptions): DynamicModule {
        return {
            module: LoggerModule,
            global: true,
            providers: [
                { provide: LOGGER_OPTIONS, useValue: options },
                LoggerService,
            ],
            exports: [LoggerService],
        };
    }
}
