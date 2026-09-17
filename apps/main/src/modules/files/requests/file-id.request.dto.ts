import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { SEED_FILES } from '~/common/api/swagger/seed-examples';

export const fileParams = z.object({
    id: z.uuid().meta({
        examples: [
            SEED_FILES.ownerSalesReport.id,
            SEED_FILES.ownerTeamBudget.id,
        ],
    }),
});

export type FileParams = z.infer<typeof fileParams>;

export class FileParamsDto extends createZodDto(fileParams) {}
