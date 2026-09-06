import { Body, Controller, Post } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { getActiveOrgId } from '~/common/tenancy/organization/organization-context';
import { requestContext } from '~/common/tenancy/request-context/request-context';
import { AUTH_GUEST } from '~/common/security/auth.types';
import { AiGenerationService } from '~/modules/ai/ai-generation/ai.generation.service';

type GenerationRequestBody = {
    prompt: string;
};

@Controller('ai')
export class AiGenerationController {
    constructor(private readonly aiService: AiGenerationService) {}

    @Post('generation')
    async requestGeneration(@Body() body: GenerationRequestBody) {
        const ownerId = this.getActiveUserId();
        const organizationId = getActiveOrgId();

        await this.aiService.publishGenerationRequest({
            requestId: randomUUID(),
            organizationId,
            ownerId,
            prompt: body.prompt,
            publishedAt: new Date().toISOString(),
        });

        return { accepted: true };
    }

    private getActiveUserId(): string {
        const userId = requestContext.getStore()?.userId;

        if (!userId || userId === AUTH_GUEST) {
            throw new Error('Missing user context');
        }

        return userId;
    }
}
