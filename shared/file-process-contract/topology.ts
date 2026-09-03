import {
    FILE_PROCESS_DLQ,
    FILE_PROCESS_DLQ_ROUTING_KEY,
    FILE_PROCESS_DLX,
    FILE_PROCESS_EXCHANGE,
    FILE_PROCESS_QUEUE,
    FILE_PROCESS_RESULTS_EXCHANGE,
    FILE_PROCESS_RESULTS_QUEUE,
    FILE_PROCESS_RESULTS_ROUTING_KEY,
    FILE_PROCESS_ROUTING_KEY,
} from './constants';
import type { RabbitmqTopology } from '../rabbitmq';

export const fileProcessTopology: RabbitmqTopology = {
    exchanges: [
        {
            name: FILE_PROCESS_EXCHANGE,
            type: 'topic',
            options: { durable: true },
        },
        {
            name: FILE_PROCESS_DLX,
            type: 'topic',
            options: { durable: true },
        },
        {
            name: FILE_PROCESS_RESULTS_EXCHANGE,
            type: 'topic',
            options: { durable: true },
        },
    ],
    queues: [
        {
            name: FILE_PROCESS_QUEUE,
            options: {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': FILE_PROCESS_DLX,
                    'x-dead-letter-routing-key': FILE_PROCESS_DLQ_ROUTING_KEY,
                },
            },
            bindings: [
                {
                    exchange: FILE_PROCESS_EXCHANGE,
                    routingKey: FILE_PROCESS_ROUTING_KEY,
                },
            ],
        },
        {
            name: FILE_PROCESS_DLQ,
            options: { durable: true },
            bindings: [
                {
                    exchange: FILE_PROCESS_DLX,
                    routingKey: FILE_PROCESS_DLQ_ROUTING_KEY,
                },
            ],
        },
        {
            name: FILE_PROCESS_RESULTS_QUEUE,
            options: { durable: true },
            bindings: [
                {
                    exchange: FILE_PROCESS_RESULTS_EXCHANGE,
                    routingKey: FILE_PROCESS_RESULTS_ROUTING_KEY,
                },
            ],
        },
    ],
};
