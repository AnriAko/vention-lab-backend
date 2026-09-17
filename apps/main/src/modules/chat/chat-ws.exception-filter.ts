import { Catch } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';

import { getWsClient } from '~/common/security/utils/execution-context';
import { LoggerService } from '@vention/shared-logger';

import { CHAT_WS_EVENTS } from './chat.ws.constants';

@Catch()
export class ChatWsExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: LoggerService) {}

    catch(exception: unknown, host: ArgumentsHost): void {
        const client = getWsClient(host);
        const message =
            exception instanceof Error ? exception.message : 'Unexpected error';

        client.emit(CHAT_WS_EVENTS.ERROR, {
            message,
        });

        this.logger.warn(`[ChatGateway] ${message}`);
    }
}
