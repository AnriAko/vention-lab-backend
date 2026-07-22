import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { SEED_USERS } from '~/common/api';

export const UserId = z.object({
    id: z.uuid().meta({
        examples: [SEED_USERS.demoMember.id],
    }),
});

export type UserId = z.infer<typeof UserId>;

export class UserIdDto extends createZodDto(UserId) {}
