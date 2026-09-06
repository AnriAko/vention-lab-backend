import { appConfig } from '~/config/configuration/app.config';
import { databaseConfig } from '~/config/configuration/database.config';
import { clamavConfig } from '~/config/configuration/clamav.config';
import { firebaseConfig } from '~/config/configuration/firebase.config';
import { redisConfig } from '~/config/configuration/redis.config';
import { rabbitmqConfig } from '~/config/configuration/rabbitmq.config';
import { jwtConfig } from '~/config/configuration/jwt.config';
import { argon2Config } from '~/config/configuration/argon2.config';
import { ragConfig } from '~/config/configuration/rag.config';

export const configLoaders = [
    appConfig,
    databaseConfig,
    clamavConfig,
    firebaseConfig,
    redisConfig,
    rabbitmqConfig,
    jwtConfig,
    argon2Config,
    ragConfig,
];
