import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GenerationStartRequest = z.object({
    generationId: z.uuid(),

    conversationId: z.uuid().optional(),

    query: z.string().min(1),

    options: z
        .object({
            temperature: z.number().min(0).max(2).optional(),
            maxTokens: z.number().int().positive().optional(),
        })
        .optional(),
});

export type GenerationStartRequest = z.infer<typeof GenerationStartRequest>;

export class GenerationStartRequestDto extends createZodDto(
    GenerationStartRequest
) {}
