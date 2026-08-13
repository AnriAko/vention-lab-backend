import type { Channel, Options } from 'amqplib';

export type RabbitmqTopology = {
    exchanges: Array<{
        name: string;
        type: 'direct' | 'topic' | 'fanout' | 'headers';
        options?: Options.AssertExchange;
    }>;
    queues: Array<{
        name: string;
        options?: Options.AssertQueue;
        bindings: Array<{ exchange: string; routingKey: string }>;
    }>;
};

export async function assertRabbitmqTopology(
    channel: Channel,
    topology: RabbitmqTopology
): Promise<void> {
    for (const exchange of topology.exchanges) {
        await channel.assertExchange(
            exchange.name,
            exchange.type,
            exchange.options
        );
    }

    for (const queue of topology.queues) {
        await channel.assertQueue(queue.name, queue.options);

        for (const binding of queue.bindings) {
            await channel.bindQueue(
                queue.name,
                binding.exchange,
                binding.routingKey
            );
        }
    }
}
