import { type DynamicModule, Module } from '@nestjs/common';

import { FirebaseService } from './firebase.service';
import { FIREBASE_OPTIONS, type FirebaseOptions } from './firebase.types';

type FirebaseAsyncOptions = {
    inject?: any[];
    useFactory: (...args: any[]) => FirebaseOptions | Promise<FirebaseOptions>;
};

@Module({})
export class FirebaseModule {
    static forRoot(options: FirebaseOptions): DynamicModule {
        return {
            module: FirebaseModule,
            global: true,
            providers: [
                { provide: FIREBASE_OPTIONS, useValue: options },
                FirebaseService,
            ],
            exports: [FirebaseService],
        };
    }

    static forRootAsync(options: FirebaseAsyncOptions): DynamicModule {
        return {
            module: FirebaseModule,
            global: true,
            providers: [
                {
                    provide: FIREBASE_OPTIONS,
                    inject: options.inject ?? [],
                    useFactory: options.useFactory,
                },
                FirebaseService,
            ],
            exports: [FirebaseService],
        };
    }
}
