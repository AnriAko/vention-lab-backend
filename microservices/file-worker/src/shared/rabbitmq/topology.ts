import type { Channel } from 'amqplib';

import type { RabbitmqTopology } from './types';

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
