import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { PaginationSchema } from '~/common/api';

export const Search = PaginationSchema.extend({
    query: z
        .string()
        .min(2)
        .meta({
            description: 'Search term (seeded org names / emails work well)',
            examples: ['Cat', 'admin.catfans', 'Demo'],
        }),
});

export type Search = z.infer<typeof Search>;

export class SearchDto extends createZodDto(Search) {}
