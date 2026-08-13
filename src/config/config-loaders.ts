import { appConfig } from '~/config/configuration/app.config';
import { databaseConfig } from '~/config/configuration/database.config';
import { firebaseConfig } from '~/config/configuration/firebase.config';
import { redisConfig } from '~/config/configuration/redis.config';
import { rabbitmqConfig } from '~/config/configuration/rabbitmq.config';
import { jwtConfig } from '~/config/configuration/jwt.config';
import { argon2Config } from '~/config/configuration/argon2.config';

export const configLoaders = [
    appConfig,
    databaseConfig,
    firebaseConfig,
    redisConfig,
    rabbitmqConfig,
    jwtConfig,
    argon2Config,
];
