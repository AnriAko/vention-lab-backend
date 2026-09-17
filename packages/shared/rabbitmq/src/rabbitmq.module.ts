import { type DynamicModule, Module } from '@nestjs/common';

import { RabbitmqService } from './rabbitmq.service';
import { RABBITMQ_OPTIONS, type RabbitmqOptions } from './types';

type RabbitmqAsyncOptions = {
    inject?: any[];
    useFactory: (...args: any[]) => RabbitmqOptions | Promise<RabbitmqOptions>;
};

@Module({})
export class RabbitmqModule {
    static forRoot(options: RabbitmqOptions): DynamicModule {
        return {
            module: RabbitmqModule,
            global: true,
            providers: [
                { provide: RABBITMQ_OPTIONS, useValue: options },
                RabbitmqService,
            ],
            exports: [RabbitmqService],
        };
    }

    static forRootAsync(options: RabbitmqAsyncOptions): DynamicModule {
        return {
            module: RabbitmqModule,
            global: true,
            providers: [
                {
                    provide: RABBITMQ_OPTIONS,
                    inject: options.inject ?? [],
                    useFactory: options.useFactory,
                },
                RabbitmqService,
            ],
            exports: [RabbitmqService],
        };
    }
}
