import { Inject, Injectable } from '@nestjs/common';
import type { Bucket } from '@google-cloud/storage';
import type { App } from 'firebase-admin/app';

import {
    getFirebaseStorageBucket,
    initializeFirebaseAdmin,
} from './firebase-admin.app';
import { FIREBASE_OPTIONS, type FirebaseOptions } from './firebase.types';

@Injectable()
export class FirebaseService {
    private readonly app: App;
    private readonly bucket: Bucket;

    constructor(
        @Inject(FIREBASE_OPTIONS)
        private readonly options: FirebaseOptions
    ) {
        this.app = initializeFirebaseAdmin(this.options);
        this.bucket = getFirebaseStorageBucket(this.options.storageBucket);
    }

    getApp(): App {
        return this.app;
    }

    getBucket(): Bucket {
        return this.bucket;
    }
}
