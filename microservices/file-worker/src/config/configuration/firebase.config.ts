import { registerAs } from '@nestjs/config';

import { ConfigKeys } from '~/config/config.keys';

export const firebaseConfig = registerAs(ConfigKeys.FIREBASE, () => ({
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
}));
