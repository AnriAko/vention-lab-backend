import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const UserIdSchema = z.object({
    id: z.uuid(),
});

export class UserIdDto extends createZodDto(UserIdSchema) {}
