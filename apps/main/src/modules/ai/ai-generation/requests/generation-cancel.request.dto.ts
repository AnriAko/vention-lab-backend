import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GenerationCancelRequest = z.object({
    generationId: z.uuid(),
});

export type GenerationCancelRequest = z.infer<typeof GenerationCancelRequest>;

export class GenerationCancelRequestDto extends createZodDto(
    GenerationCancelRequest
) {}
