import type { ArgumentsHost, ExecutionContext } from '@nestjs/common';
import type { GqlContextType } from '@nestjs/graphql';
import { GqlExecutionContext } from '@nestjs/graphql';

import type { AuthRequest } from '~/common/security/auth.types';
import type { WsClient } from '~/common/security/ws-client.types';

export function isGraphqlContext(context: ExecutionContext): boolean {
    return context.getType<GqlContextType>() === 'graphql';
}

export function isWsContext(context: ArgumentsHost): boolean {
    return context.getType() === 'ws';
}

export function getWsClient(context: ArgumentsHost): WsClient {
    return context.switchToWs().getClient();
}

export function getRequest(context: ExecutionContext): AuthRequest {
    if (isGraphqlContext(context)) {
        return GqlExecutionContext.create(context).getContext<{
            req: AuthRequest;
        }>().req;
    }

    return context.switchToHttp().getRequest<AuthRequest>();
}
