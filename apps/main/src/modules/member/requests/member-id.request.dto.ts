import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { SEED_USERS } from '~/common/api/swagger/seed-examples';

export const memberParams = z.object({
    userId: z.uuid().meta({
        examples: [SEED_USERS.demoMember.id],
    }),
});

export type memberParams = z.infer<typeof memberParams>;

export class memberParamsDto extends createZodDto(memberParams) {}
