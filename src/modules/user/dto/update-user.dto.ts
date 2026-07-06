import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const UpdateUserSchema = z
    .object({
        email: z.email(),
        name: z.string().min(1),
        password: z.string().min(8),
        organizationId: z.uuid(),
    })
    .partial();

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
