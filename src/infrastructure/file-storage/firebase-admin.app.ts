import path from 'node:path';

import type { Bucket } from '@google-cloud/storage';
import type { App } from 'firebase-admin/app';
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { FirebaseAdminOptions } from '~/infrastructure/file-storage/types/firebase.types';

export function initializeFirebaseAdmin(options: FirebaseAdminOptions): App {
    if (getApps().length > 0) {
        return getApp();
    }

    const serviceAccountPath = path.resolve(
        process.cwd(),
        options.serviceAccountPath
    );

    return initializeApp({
        credential: cert(serviceAccountPath),
        projectId: options.projectId,
        storageBucket: options.storageBucket,
    });
}

export function getFirebaseStorageBucket(storageBucket?: string): Bucket {
    const bucketName =
        storageBucket ?? process.env.FIREBASE_STORAGE_BUCKET ?? undefined;

    if (!bucketName) {
        throw new Error('Firebase storage bucket is not configured');
    }

    return getStorage().bucket(bucketName);
}
