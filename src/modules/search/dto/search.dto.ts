import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { OffsetPaginationSchema } from '~/common/dto/offset-pagination.dto';

export const SearchSchema = OffsetPaginationSchema.extend({
    query: z.string().min(2),
});

export class SearchDto extends createZodDto(SearchSchema) {}
