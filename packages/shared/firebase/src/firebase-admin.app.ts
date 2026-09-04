import { existsSync } from 'node:fs';
import path from 'node:path';

import type { Bucket } from '@google-cloud/storage';
import type { App } from 'firebase-admin/app';
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

import type { FirebaseOptions } from './firebase.types';

function resolveServiceAccountPath(serviceAccountPath: string): string {
    const candidates = [
        path.resolve(process.cwd(), serviceAccountPath),
        path.resolve(process.cwd(), '../../', serviceAccountPath),
    ];

    return (
        candidates.find((candidate) => existsSync(candidate)) ?? candidates[0]
    );
}

export function initializeFirebaseAdmin(options: FirebaseOptions): App {
    if (getApps().length > 0) {
        return getApp();
    }

    const serviceAccountPath = resolveServiceAccountPath(
        options.serviceAccountPath
    );

    return initializeApp({
        credential: cert(serviceAccountPath),
        projectId: options.projectId,
        storageBucket: options.storageBucket,
    });
}

export function getFirebaseStorageBucket(storageBucket: string): Bucket {
    if (!storageBucket) {
        throw new Error('Firebase storage bucket is not configured');
    }

    return getStorage().bucket(storageBucket);
}
