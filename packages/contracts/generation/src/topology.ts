import {
    GENERATION_EVENTS_EXCHANGE,
    GENERATION_EVENTS_QUEUE,
    GENERATION_EVENT_ROUTING_KEY,
    GENERATION_EXCHANGE,
    GENERATION_REQUEST_DLQ,
    GENERATION_REQUEST_DLQ_ROUTING_KEY,
    GENERATION_REQUEST_DLX,
    GENERATION_REQUEST_QUEUE,
    GENERATION_REQUEST_ROUTING_KEY,
    GENERATION_RESULTS_EXCHANGE,
    GENERATION_RESULTS_QUEUE,
    GENERATION_RESULT_ROUTING_KEY,
} from './constants';
import type { RabbitmqTopology } from '@vention/shared-rabbitmq';

export const generationTopology: RabbitmqTopology = {
    exchanges: [
        {
            name: GENERATION_EXCHANGE,
            type: 'topic',
            options: { durable: true },
        },
        {
            name: GENERATION_REQUEST_DLX,
            type: 'topic',
            options: { durable: true },
        },
        {
            name: GENERATION_RESULTS_EXCHANGE,
            type: 'topic',
            options: { durable: true },
        },
        {
            name: GENERATION_EVENTS_EXCHANGE,
            type: 'topic',
            options: { durable: true },
        },
    ],
    queues: [
        {
            name: GENERATION_REQUEST_QUEUE,
            options: {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': GENERATION_REQUEST_DLX,
                    'x-dead-letter-routing-key':
                        GENERATION_REQUEST_DLQ_ROUTING_KEY,
                },
            },
            bindings: [
                {
                    exchange: GENERATION_EXCHANGE,
                    routingKey: GENERATION_REQUEST_ROUTING_KEY,
                },
            ],
        },
        {
            name: GENERATION_REQUEST_DLQ,
            options: { durable: true },
            bindings: [
                {
                    exchange: GENERATION_REQUEST_DLX,
                    routingKey: GENERATION_REQUEST_DLQ_ROUTING_KEY,
                },
            ],
        },
        {
            name: GENERATION_RESULTS_QUEUE,
            options: { durable: true },
            bindings: [
                {
                    exchange: GENERATION_RESULTS_EXCHANGE,
                    routingKey: GENERATION_RESULT_ROUTING_KEY,
                },
            ],
        },
        {
            name: GENERATION_EVENTS_QUEUE,
            options: { durable: true },
            bindings: [
                {
                    exchange: GENERATION_EVENTS_EXCHANGE,
                    routingKey: GENERATION_EVENT_ROUTING_KEY,
                },
            ],
        },
    ],
};
