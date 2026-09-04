import {
    RAG_DELETE_DLQ,
    RAG_DELETE_DLQ_ROUTING_KEY,
    RAG_DELETE_DLX,
    RAG_DELETE_QUEUE,
    RAG_DELETE_ROUTING_KEY,
    RAG_EXCHANGE,
    RAG_PROCESS_DLQ,
    RAG_PROCESS_DLQ_ROUTING_KEY,
    RAG_PROCESS_DLX,
    RAG_PROCESS_QUEUE,
    RAG_PROCESS_RESULTS_EXCHANGE,
    RAG_PROCESS_RESULTS_QUEUE,
    RAG_PROCESS_RESULTS_ROUTING_KEY,
    RAG_PROCESS_ROUTING_KEY,
} from './constants';
import type { RabbitmqTopology } from '@vention/shared-rabbitmq';

export const ragTopology: RabbitmqTopology = {
    exchanges: [
        {
            name: RAG_EXCHANGE,
            type: 'topic',
            options: { durable: true },
        },
        {
            name: RAG_PROCESS_DLX,
            type: 'topic',
            options: { durable: true },
        },
        {
            name: RAG_DELETE_DLX,
            type: 'topic',
            options: { durable: true },
        },
        {
            name: RAG_PROCESS_RESULTS_EXCHANGE,
            type: 'topic',
            options: { durable: true },
        },
    ],
    queues: [
        {
            name: RAG_PROCESS_QUEUE,
            options: {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': RAG_PROCESS_DLX,
                    'x-dead-letter-routing-key': RAG_PROCESS_DLQ_ROUTING_KEY,
                },
            },
            bindings: [
                {
                    exchange: RAG_EXCHANGE,
                    routingKey: RAG_PROCESS_ROUTING_KEY,
                },
            ],
        },
        {
            name: RAG_PROCESS_DLQ,
            options: { durable: true },
            bindings: [
                {
                    exchange: RAG_PROCESS_DLX,
                    routingKey: RAG_PROCESS_DLQ_ROUTING_KEY,
                },
            ],
        },
        {
            name: RAG_DELETE_QUEUE,
            options: {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': RAG_DELETE_DLX,
                    'x-dead-letter-routing-key': RAG_DELETE_DLQ_ROUTING_KEY,
                },
            },
            bindings: [
                {
                    exchange: RAG_EXCHANGE,
                    routingKey: RAG_DELETE_ROUTING_KEY,
                },
            ],
        },
        {
            name: RAG_DELETE_DLQ,
            options: { durable: true },
            bindings: [
                {
                    exchange: RAG_DELETE_DLX,
                    routingKey: RAG_DELETE_DLQ_ROUTING_KEY,
                },
            ],
        },
        {
            name: RAG_PROCESS_RESULTS_QUEUE,
            options: { durable: true },
            bindings: [
                {
                    exchange: RAG_PROCESS_RESULTS_EXCHANGE,
                    routingKey: RAG_PROCESS_RESULTS_ROUTING_KEY,
                },
            ],
        },
    ],
};
