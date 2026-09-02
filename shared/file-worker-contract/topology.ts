import {
    FILE_WORKER_EXCHANGE,
    FILE_WORKER_PROCESSING_ROUTING_KEY,
    FILE_WORKER_PROCESSING_QUEUE,
    FILE_WORKER_PROCESSING_DLX,
    FILE_WORKER_PROCESSING_DLQ,
    FILE_WORKER_PROCESSING_DLQ_ROUTING_KEY,
    FILE_WORKER_DELETE_ROUTING_KEY,
    FILE_WORKER_DELETE_QUEUE,
    FILE_WORKER_DELETE_DLX,
    FILE_WORKER_DELETE_DLQ,
    FILE_WORKER_DELETE_DLQ_ROUTING_KEY,
    FILE_WORKER_PROCESSING_RESULTS_EXCHANGE,
    FILE_WORKER_PROCESSING_RESULTS_QUEUE,
    FILE_WORKER_PROCESSING_RESULTS_ROUTING_KEY,
} from './constants';

import type { RabbitmqTopology } from '../rabbitmq';

export const fileWorkerTopology: RabbitmqTopology = {
    exchanges: [
        {
            name: FILE_WORKER_EXCHANGE,
            type: 'topic',
            options: { durable: true },
        },
        {
            name: FILE_WORKER_PROCESSING_DLX,
            type: 'topic',
            options: { durable: true },
        },
        {
            name: FILE_WORKER_DELETE_DLX,
            type: 'topic',
            options: { durable: true },
        },
        {
            name: FILE_WORKER_PROCESSING_RESULTS_EXCHANGE,
            type: 'topic',
            options: { durable: true },
        },
    ],

    queues: [
        // Processing
        {
            name: FILE_WORKER_PROCESSING_QUEUE,
            options: {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': FILE_WORKER_PROCESSING_DLX,
                    'x-dead-letter-routing-key':
                        FILE_WORKER_PROCESSING_DLQ_ROUTING_KEY,
                },
            },
            bindings: [
                {
                    exchange: FILE_WORKER_EXCHANGE,
                    routingKey: FILE_WORKER_PROCESSING_ROUTING_KEY,
                },
            ],
        },

        {
            name: FILE_WORKER_PROCESSING_DLQ,
            options: { durable: true },
            bindings: [
                {
                    exchange: FILE_WORKER_PROCESSING_DLX,
                    routingKey: FILE_WORKER_PROCESSING_DLQ_ROUTING_KEY,
                },
            ],
        },

        // Delete
        {
            name: FILE_WORKER_DELETE_QUEUE,
            options: {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': FILE_WORKER_DELETE_DLX,
                    'x-dead-letter-routing-key':
                        FILE_WORKER_DELETE_DLQ_ROUTING_KEY,
                },
            },
            bindings: [
                {
                    exchange: FILE_WORKER_EXCHANGE,
                    routingKey: FILE_WORKER_DELETE_ROUTING_KEY,
                },
            ],
        },

        {
            name: FILE_WORKER_DELETE_DLQ,
            options: { durable: true },
            bindings: [
                {
                    exchange: FILE_WORKER_DELETE_DLX,
                    routingKey: FILE_WORKER_DELETE_DLQ_ROUTING_KEY,
                },
            ],
        },

        // Processing results
        {
            name: FILE_WORKER_PROCESSING_RESULTS_QUEUE,
            options: { durable: true },
            bindings: [
                {
                    exchange: FILE_WORKER_PROCESSING_RESULTS_EXCHANGE,
                    routingKey: FILE_WORKER_PROCESSING_RESULTS_ROUTING_KEY,
                },
            ],
        },
    ],
};
