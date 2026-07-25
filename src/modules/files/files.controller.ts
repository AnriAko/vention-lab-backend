import {
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBody,
    ApiConsumes,
    ApiOkResponse,
    ApiProduces,
    ApiTags,
} from '@nestjs/swagger';

import { ApiEndpoint } from '~/common/api/decorators/api-endpoint.decorator';
import { EmptyResponse } from '~/common/api/dto/empty.response';
import { ApiPaginatedResponse } from '~/common/api/pagination/pagination.response';
import { ApiResponse } from '~/common/api/response/response.decorator';
import {
    SEED_FILES,
    SEED_ORGANIZATIONS,
} from '~/common/api/swagger/seed-examples';
import { ApiOrganizationHeader } from '~/common/security/decorators/api-organization-header.decorator';
import { Roles } from '~/common/security/decorators/roles.decorator';
import { AppRole } from '~/common/security/permissions/app-role.enum';

import { FILE_MAX_SIZE_BYTES } from './files.constants';
import { FilesService } from './files.service';
import { FileParamsDto } from './requests/file-id.request.dto';
import { FileQuery } from './requests/file-query.dto';
import { FileResponse } from './responses/file.response';
import type { MulterUploadedFile } from './types/uploaded-file.type';

@ApiTags('files')
@Roles(AppRole.USER)
@ApiOrganizationHeader()
@Controller('files')
export class FilesController {
    constructor(private readonly filesService: FilesService) {}

    @Get()
    @ApiEndpoint({
        summary: 'List files',
        roles: [AppRole.USER],
        description:
            'Offset-paginated files of the organization (`x-organization-id`). Sorted by name. After seeding, try CatFans (`' +
            SEED_ORGANIZATIONS.catFans.id +
            '`) to see owner example Excel files.',
    })
    @ApiPaginatedResponse(FileResponse)
    findAll(@Query() query: FileQuery) {
        return this.filesService.findAll(query);
    }

    @Get(':id/download')
    @ApiEndpoint({
        summary: 'Download file',
        roles: [AppRole.USER],
        description: `Streams the stored file binary for a file in the active organization. Seeded owner examples: \`${SEED_FILES.ownerSalesReport.id}\` (\`${SEED_FILES.ownerSalesReport.name}\`), \`${SEED_FILES.ownerTeamBudget.id}\` (\`${SEED_FILES.ownerTeamBudget.name}\`).`,
    })
    @ApiProduces(
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/octet-stream'
    )
    @ApiOkResponse({
        description: 'File binary content',
        schema: {
            type: 'string',
            format: 'binary',
        },
    })
    download(@Param() params: FileParamsDto) {
        return this.filesService.download(params.id);
    }

    @Get(':id')
    @ApiEndpoint({
        summary: 'Get file by id',
        roles: [AppRole.USER],
        description: `Returns file metadata for a file in the active organization. Seeded owner file ids: \`${SEED_FILES.ownerSalesReport.id}\`, \`${SEED_FILES.ownerTeamBudget.id}\`.`,
    })
    @ApiResponse(FileResponse)
    findById(@Param() params: FileParamsDto) {
        return this.filesService.findById(params.id);
    }

    @Post()
    @ApiEndpoint({
        summary: 'Upload file',
        roles: [AppRole.USER],
        description:
            'Uploads a single file (`multipart/form-data`, field name `file`). Validates MIME type and extension, computes SHA-256, deduplicates by checksum within the organization, and stores new files under `/files`.\n\n' +
            'Validation errors: `FILE_REQUIRED`, `FILE_EMPTY`, `FILE_TOO_LARGE`, `FILE_INVALID_TYPE`, `FILE_INVALID_EXTENSION`, `FILE_TYPE_MISMATCH`.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['file'],
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'File to upload',
                },
            },
        },
    })
    @ApiResponse(FileResponse)
    @UseInterceptors(
        FileInterceptor('file', {
            limits: {
                fileSize: FILE_MAX_SIZE_BYTES,
                files: 1,
            },
        })
    )
    uploadFile(@UploadedFile() file: MulterUploadedFile) {
        return this.filesService.uploadFile(file);
    }

    @Delete(':id')
    @ApiEndpoint({
        summary: 'Delete file',
        roles: [AppRole.USER],
        description: `Deletes file metadata from the active organization and removes the stored file from disk when no other records reference it. Seeded owner file ids (for try/delete after re-seed): \`${SEED_FILES.ownerSalesReport.id}\`, \`${SEED_FILES.ownerTeamBudget.id}\`.`,
    })
    @ApiResponse(EmptyResponse)
    remove(@Param() params: FileParamsDto) {
        return this.filesService.remove(params.id);
    }
}
