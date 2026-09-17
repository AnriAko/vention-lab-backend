import { Controller } from '@nestjs/common';
import { Ctx, MessagePattern, RmqContext } from '@nestjs/microservices';
import { EMPTY, type Observable } from 'rxjs';
import type { ConsumeMessage, Channel } from 'amqplib';

import {
    HEALTH_CHECK_PATTERN,
    type HealthCheckResult,
} from '@vention/health-contract';

@Controller()
export class HealthController {
    @MessagePattern(HEALTH_CHECK_PATTERN)
    check(@Ctx() context: RmqContext): Observable<never> {
        const message = context.getMessage() as unknown as ConsumeMessage;
        const channel = context.getChannelRef() as unknown as Channel;
        const correlationId = this.getStringProperty(
            message.properties.correlationId
        );
        const replyTo = this.getStringProperty(message.properties.replyTo);

        if (!correlationId || !replyTo) {
            channel.ack(message);
            return EMPTY;
        }

        channel.sendToQueue(
            replyTo,
            Buffer.from(
                JSON.stringify({
                    id: correlationId,
                    response: {
                        status: 'up',
                        service: 'rag',
                    } satisfies HealthCheckResult,
                    isDisposed: true,
                })
            ),
            { correlationId }
        );
        channel.ack(message);

        return EMPTY;
    }

    private getStringProperty(value: unknown): string | undefined {
        return typeof value === 'string' && value.length > 0
            ? value
            : undefined;
    }
}
