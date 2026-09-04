import { firebaseConfig } from '~/config/configuration/firebase.config';
import { rabbitmqConfig } from '~/config/configuration/rabbitmq.config';

export const configLoaders = [rabbitmqConfig, firebaseConfig];
