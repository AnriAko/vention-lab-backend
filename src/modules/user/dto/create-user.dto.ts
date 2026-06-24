import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const CreateUserSchema = z.object({
    email: z.email(),
    name: z.string().min(1),
    password: z.string().min(8),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
