import { chunkingConfig } from '~/config/configuration/chunking.config';
import { embeddingConfig } from '~/config/configuration/embedding.config';
import { firebaseConfig } from '~/config/configuration/firebase.config';
import { qdrantConfig } from '~/config/configuration/qdrant.config';
import { rabbitmqConfig } from '~/config/configuration/rabbitmq.config';

export const configLoaders = [
    rabbitmqConfig,
    firebaseConfig,
    qdrantConfig,
    chunkingConfig,
    embeddingConfig,
];
