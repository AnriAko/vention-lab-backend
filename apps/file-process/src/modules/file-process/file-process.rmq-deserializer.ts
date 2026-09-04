import type {
    ConsumerDeserializer,
    IncomingEvent,
} from '@nestjs/microservices';

import { FILE_PROCESS_ROUTING_KEY } from '@vention/file-process-contract/constants';

type NestRmqPacket = {
    pattern: unknown;
    data: unknown;
};

export class FileProcessRmqDeserializer implements ConsumerDeserializer {
    deserialize(
        value: unknown,
        options?: Record<string, unknown>
    ): IncomingEvent {
        if (this.isNestPacket(value)) {
            return {
                pattern: value.pattern,
                data: value.data,
            };
        }

        const type = options?.type;

        return {
            pattern:
                typeof type === 'string' && type.length > 0
                    ? type
                    : FILE_PROCESS_ROUTING_KEY,
            data: value,
        };
    }

    private isNestPacket(value: unknown): value is NestRmqPacket {
        return (
            typeof value === 'object' &&
            value !== null &&
            'pattern' in value &&
            'data' in value
        );
    }
}
