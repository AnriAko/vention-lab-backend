import { Injectable, StreamableFile } from '@nestjs/common';

import { AppException } from '~/common/errors/app-exception';
import type { Pagination } from '~/common/api/pagination/pagination.schema';
import { getActiveOrgId } from '~/common/tenancy/organization/organization-context';
import { requestContext } from '~/common/tenancy/request-context/request-context';
import { AUTH_GUEST } from '~/common/security/auth.types';
import { LoggerService } from '~/infrastructure/logging/logger.service';

import { FileErrors } from './files.errors';
import { FileStorageService } from './file-storage.service';
import { FilesRepository } from './files.repository';
import type { MulterUploadedFile } from './types/uploaded-file.type';
import { calculateSha256 } from './utils/calculate-sha256';
import { validateUploadedFile } from './utils/validate-uploaded-file';
import { buildStoredFileName } from '~/modules/files/utils/build-stored-filename';
import { buildContentDisposition } from '~/modules/files/utils/build-content-disposition';

@Injectable()
export class FilesService {
    constructor(
        private readonly filesRepository: FilesRepository,
        private readonly fileStorageService: FileStorageService,
        private readonly logger: LoggerService
    ) {}

    findAll(pagination: Pagination) {
        return this.filesRepository.findAll(pagination);
    }

    async findById(id: string) {
        const file = await this.filesRepository.findById(id);

        if (!file) {
            throw new AppException(FileErrors.NOT_FOUND);
        }

        return file;
    }

    async download(id: string) {
        const file = await this.findById(id);
        await this.fileStorageService.assertExists(file.storageKey);

        const stream = this.fileStorageService.openReadStream(file.storageKey);

        return new StreamableFile(stream, {
            type: file.contentType,
            disposition: buildContentDisposition(file.name),
            length: file.size,
        });
    }

    async uploadFile(file: MulterUploadedFile | undefined) {
        const validated = validateUploadedFile(file);
        const checksum = calculateSha256(validated.buffer);

        const existing = await this.filesRepository.findByChecksum(checksum);

        if (existing) {
            this.logger.log(
                `[FilesService] deduplicated upload checksum=${checksum} fileId=${existing.id}`
            );
            return existing;
        }

        const ownerId = this.getActiveUserId();
        const organizationId = getActiveOrgId();
        const storageKey = buildStoredFileName(validated.extension);

        await this.fileStorageService.writeFile(storageKey, validated.buffer);

        try {
            const created = await this.filesRepository.create({
                ownerId,
                organizationId,
                name: validated.originalName,
                size: validated.size,
                contentType: validated.mimeType,
                checksum,
                storageKey,
            });

            this.logger.log(
                `[FilesService] uploaded fileId=${created.id} storageKey=${storageKey} size=${validated.size}`
            );

            return created;
        } catch (error) {
            await this.fileStorageService.remove(storageKey);
            throw error;
        }
    }

    async remove(id: string): Promise<null> {
        const file = await this.findById(id);
        const remainingRefs = await this.filesRepository.countByStorageKey(
            file.storageKey,
            file.id
        );

        await this.filesRepository.deleteById(file.id);

        if (remainingRefs === 0) {
            await this.fileStorageService.remove(file.storageKey);
        }

        this.logger.log(
            `[FilesService] deleted fileId=${file.id} storageKey=${file.storageKey}`
        );

        return null;
    }

    private getActiveUserId(): string {
        const userId = requestContext.getStore()?.userId;

        if (!userId || userId === AUTH_GUEST) {
            throw new Error('Missing user context');
        }

        return userId;
    }
}
