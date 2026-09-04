import { createZodDto } from 'nestjs-zod';

import { PaginationSchema } from '~/common/api/pagination/pagination.schema';

export const FileQuerySchema = PaginationSchema;

export class FileQuery extends createZodDto(FileQuerySchema) {}
