import type { ExecutionContext } from '@nestjs/common';
import type { GqlContextType } from '@nestjs/graphql';
import { GqlExecutionContext } from '@nestjs/graphql';

import type { AuthRequest } from '~/common/security/auth.types';

export function isGraphqlContext(context: ExecutionContext): boolean {
    return context.getType<GqlContextType>() === 'graphql';
}

export function getRequest(context: ExecutionContext): AuthRequest {
    if (isGraphqlContext(context)) {
        return GqlExecutionContext.create(context).getContext<{
            req: AuthRequest;
        }>().req;
    }

    return context.switchToHttp().getRequest<AuthRequest>();
}
