import {
    FILE_PROCESSING_DLQ,
    FILE_PROCESSING_DLQ_ROUTING_KEY,
    FILE_PROCESSING_DLX,
    FILE_PROCESSING_EXCHANGE,
    FILE_PROCESSING_QUEUE,
    FILE_PROCESSING_RESULTS_EXCHANGE,
    FILE_PROCESSING_RESULTS_QUEUE,
    FILE_PROCESSING_RESULTS_ROUTING_KEY,
    FILE_PROCESSING_ROUTING_KEY,
} from './constants';
import type { RabbitmqTopology } from '../rabbitmq';

export const fileProcessTopology: RabbitmqTopology = {
    exchanges: [
        {
            name: FILE_PROCESSING_EXCHANGE,
            type: 'topic',
            options: { durable: true },
        },
        {
            name: FILE_PROCESSING_DLX,
            type: 'topic',
            options: { durable: true },
        },
        {
            name: FILE_PROCESSING_RESULTS_EXCHANGE,
            type: 'topic',
            options: { durable: true },
        },
    ],
    queues: [
        {
            name: FILE_PROCESSING_QUEUE,
            options: {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': FILE_PROCESSING_DLX,
                    'x-dead-letter-routing-key':
                        FILE_PROCESSING_DLQ_ROUTING_KEY,
                },
            },
            bindings: [
                {
                    exchange: FILE_PROCESSING_EXCHANGE,
                    routingKey: FILE_PROCESSING_ROUTING_KEY,
                },
            ],
        },
        {
            name: FILE_PROCESSING_DLQ,
            options: { durable: true },
            bindings: [
                {
                    exchange: FILE_PROCESSING_DLX,
                    routingKey: FILE_PROCESSING_DLQ_ROUTING_KEY,
                },
            ],
        },
        {
            name: FILE_PROCESSING_RESULTS_QUEUE,
            options: { durable: true },
            bindings: [
                {
                    exchange: FILE_PROCESSING_RESULTS_EXCHANGE,
                    routingKey: FILE_PROCESSING_RESULTS_ROUTING_KEY,
                },
            ],
        },
    ],
};
