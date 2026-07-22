import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { SEED_LOGIN_ORG_ADMIN, SEED_LOGIN_OWNER } from '~/common/api';

export const Login = z.object({
    email: z.string().meta({
        description: 'Seeded accounts: owner, org admin, or userN@example.com',
        examples: [SEED_LOGIN_OWNER.email, SEED_LOGIN_ORG_ADMIN.email],
    }),
    password: z.string().meta({
        description: 'Default seed password',
        examples: [SEED_LOGIN_OWNER.password],
    }),
});

export type Login = z.infer<typeof Login>;

export class LoginDto extends createZodDto(Login) {}
