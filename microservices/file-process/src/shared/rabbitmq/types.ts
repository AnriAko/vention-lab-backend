import type { Options } from 'amqplib';

export type RabbitmqExchangeType = 'direct' | 'topic' | 'fanout' | 'headers';

export type RabbitmqExchange = {
    name: string;
    type: RabbitmqExchangeType;
    options?: Options.AssertExchange;
};

export type RabbitmqQueueBinding = {
    exchange: string;
    routingKey: string;
};

export type RabbitmqQueue = {
    name: string;
    options?: Options.AssertQueue;
    bindings: RabbitmqQueueBinding[];
};

export type RabbitmqTopology = {
    exchanges: RabbitmqExchange[];
    queues: RabbitmqQueue[];
};
