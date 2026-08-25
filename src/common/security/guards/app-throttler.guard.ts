import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';

import { isGraphqlContext } from '~/common/security/utils/execution-context';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
    protected getRequestResponse(context: ExecutionContext): {
        req: Record<string, any>;
        res: Record<string, any>;
    } {
        if (isGraphqlContext(context)) {
            const gqlContext = GqlExecutionContext.create(context).getContext<{
                req: Record<string, any>;
                res: Record<string, any>;
            }>();

            return {
                req: gqlContext.req,
                res: gqlContext.res,
            };
        }

        return super.getRequestResponse(context);
    }
}
