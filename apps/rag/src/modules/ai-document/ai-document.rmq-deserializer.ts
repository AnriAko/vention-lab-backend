import type {
    ConsumerDeserializer,
    IncomingEvent,
    IncomingRequest,
} from '@nestjs/microservices';

type NestRmqPacket = {
    pattern: unknown;
    data: unknown;
    id?: string;
};

export class AiDocumentRmqDeserializer implements ConsumerDeserializer {
    constructor(private readonly fallbackPattern: string) {}

    deserialize(
        value: unknown,
        options?: Record<string, unknown>
    ): IncomingEvent | IncomingRequest {
        if (this.isNestPacket(value)) {
            if (typeof value.id === 'string') {
                return {
                    pattern: value.pattern,
                    data: value.data,
                    id: value.id,
                };
            }

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
                    : this.fallbackPattern,
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
