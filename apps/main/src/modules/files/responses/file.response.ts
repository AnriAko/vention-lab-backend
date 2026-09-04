import z from 'zod';

import {
    createResponseSchema,
    DateTimeResponse,
} from '~/common/api/response/response.schema';

import { FileStatus } from '~/generated/prisma/enums';

export const FileResponse = createResponseSchema(
    z.object({
        id: z.uuid(),
        ownerId: z.uuid(),
        organizationId: z.uuid(),
        name: z.string(),
        size: z.number(),
        status: z.enum(FileStatus),
        contentType: z.string(),
        storageKey: z.string(),
        processingError: z.string().nullable(),
        createdAt: DateTimeResponse,
        updatedAt: DateTimeResponse,
    }),
    'FileResponseDto'
);

export type FileResponse = z.infer<typeof FileResponse.schema>;
