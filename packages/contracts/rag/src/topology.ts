import {
    AI_DOCUMENT_DELETE_DLQ,
    AI_DOCUMENT_DELETE_DLQ_ROUTING_KEY,
    AI_DOCUMENT_DELETE_DLX,
    AI_DOCUMENT_DELETE_QUEUE,
    AI_DOCUMENT_DELETE_ROUTING_KEY,
    AI_DOCUMENT_EXCHANGE,
    AI_DOCUMENT_PROCESS_DLQ,
    AI_DOCUMENT_PROCESS_DLQ_ROUTING_KEY,
    AI_DOCUMENT_PROCESS_DLX,
    AI_DOCUMENT_PROCESS_QUEUE,
    AI_DOCUMENT_PROCESS_RESULTS_EXCHANGE,
    AI_DOCUMENT_PROCESS_RESULTS_QUEUE,
    AI_DOCUMENT_PROCESS_RESULTS_ROUTING_KEY,
    AI_DOCUMENT_PROCESS_ROUTING_KEY,
} from './constants';
import type { RabbitmqTopology } from '@vention/shared-rabbitmq';

export const aiDocumentTopology: RabbitmqTopology = {
    exchanges: [
        {
            name: AI_DOCUMENT_EXCHANGE,
            type: 'topic',
            options: { durable: true },
        },
        {
            name: AI_DOCUMENT_PROCESS_DLX,
            type: 'topic',
            options: { durable: true },
        },
        {
            name: AI_DOCUMENT_DELETE_DLX,
            type: 'topic',
            options: { durable: true },
        },
        {
            name: AI_DOCUMENT_PROCESS_RESULTS_EXCHANGE,
            type: 'topic',
            options: { durable: true },
        },
    ],
    queues: [
        {
            name: AI_DOCUMENT_PROCESS_QUEUE,
            options: {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': AI_DOCUMENT_PROCESS_DLX,
                    'x-dead-letter-routing-key':
                        AI_DOCUMENT_PROCESS_DLQ_ROUTING_KEY,
                },
            },
            bindings: [
                {
                    exchange: AI_DOCUMENT_EXCHANGE,
                    routingKey: AI_DOCUMENT_PROCESS_ROUTING_KEY,
                },
            ],
        },
        {
            name: AI_DOCUMENT_PROCESS_DLQ,
            options: { durable: true },
            bindings: [
                {
                    exchange: AI_DOCUMENT_PROCESS_DLX,
                    routingKey: AI_DOCUMENT_PROCESS_DLQ_ROUTING_KEY,
                },
            ],
        },
        {
            name: AI_DOCUMENT_DELETE_QUEUE,
            options: {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': AI_DOCUMENT_DELETE_DLX,
                    'x-dead-letter-routing-key':
                        AI_DOCUMENT_DELETE_DLQ_ROUTING_KEY,
                },
            },
            bindings: [
                {
                    exchange: AI_DOCUMENT_EXCHANGE,
                    routingKey: AI_DOCUMENT_DELETE_ROUTING_KEY,
                },
            ],
        },
        {
            name: AI_DOCUMENT_DELETE_DLQ,
            options: { durable: true },
            bindings: [
                {
                    exchange: AI_DOCUMENT_DELETE_DLX,
                    routingKey: AI_DOCUMENT_DELETE_DLQ_ROUTING_KEY,
                },
            ],
        },
        {
            name: AI_DOCUMENT_PROCESS_RESULTS_QUEUE,
            options: { durable: true },
            bindings: [
                {
                    exchange: AI_DOCUMENT_PROCESS_RESULTS_EXCHANGE,
                    routingKey: AI_DOCUMENT_PROCESS_RESULTS_ROUTING_KEY,
                },
            ],
        },
    ],
};
