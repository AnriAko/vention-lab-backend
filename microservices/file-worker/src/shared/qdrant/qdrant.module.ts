import { type DynamicModule, Module } from '@nestjs/common';

import { QdrantService } from './qdrant.service';
import { QDRANT_OPTIONS, type QdrantOptions } from './qdrant.types';

type QdrantAsyncOptions = {
    inject?: any[];
    useFactory: (...args: any[]) => QdrantOptions | Promise<QdrantOptions>;
};

@Module({})
export class QdrantModule {
    static forRoot(options: QdrantOptions): DynamicModule {
        return {
            module: QdrantModule,
            global: true,
            providers: [
                { provide: QDRANT_OPTIONS, useValue: options },
                QdrantService,
            ],
            exports: [QdrantService],
        };
    }

    static forRootAsync(options: QdrantAsyncOptions): DynamicModule {
        return {
            module: QdrantModule,
            global: true,
            providers: [
                {
                    provide: QDRANT_OPTIONS,
                    inject: options.inject ?? [],
                    useFactory: options.useFactory,
                },
                QdrantService,
            ],
            exports: [QdrantService],
        };
    }
}
