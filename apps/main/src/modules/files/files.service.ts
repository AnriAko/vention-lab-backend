import { Injectable, StreamableFile } from '@nestjs/common';

import { AppException } from '~/common/errors/app-exception';
import type { Pagination } from '~/common/api/pagination/pagination.schema';
import { getActiveOrgId } from '~/common/tenancy/organization/organization-context';
import { requestContext } from '~/common/tenancy/request-context/request-context';
import { AUTH_GUEST } from '~/common/security/auth.types';
import { ClamAvService } from '~/infrastructure/antivirus/clamav.service';
import { LoggerService } from '@vention/shared-logger';
import { FileStorageService } from '~/infrastructure/file-storage/file-storage.service';
import { FileProcessingPublisher } from '~/infrastructure/messaging/file-process/file-processing.publisher';
import { RagDeletionPublisher } from '~/infrastructure/messaging/rag/rag-deletion.publisher';
import { RagProcessingPublisher } from '~/infrastructure/messaging/rag/rag-processing.publisher';
import { FileExtensions } from '@vention/file-process-contract/constants';
import { AiDocumentExtensions } from '@vention/rag-contract/constants';
import { FileStatus } from '~/generated/prisma/enums';

import { FILE_ENCODING_GZIP } from './files.constants';
import { FileErrors } from './files.errors';
import { FilesRepository } from './files.repository';
import { FilesStatusNotifier } from './files-status.notifier';
import type { MulterUploadedFile } from './types/uploaded-file.type';
import { calculateSha256 } from './utils/calculate-sha256';
import { gunzipBuffer } from './utils/gunzip-buffer';
import { openStoredReadStream } from './utils/decompress-stream';
import { validateUploadedFile } from './utils/validate-uploaded-file';
import { buildStoredFileName } from '~/modules/files/utils/build-stored-filename';
import { buildContentDisposition } from '~/modules/files/utils/build-content-disposition';
import type { FileSafe } from '~/infrastructure/database/selects/file.types';

@Injectable()
export class FilesService {
    constructor(
        private readonly filesRepository: FilesRepository,
        private readonly fileStorageService: FileStorageService,
        private readonly clamAvService: ClamAvService,
        private readonly fileProcessingPublisher: FileProcessingPublisher,
        private readonly ragProcessingPublisher: RagProcessingPublisher,
        private readonly ragDeletionPublisher: RagDeletionPublisher,
        private readonly statusNotifier: FilesStatusNotifier,
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

        const stream = openStoredReadStream(file.storageKey, (storageKey) =>
            this.fileStorageService.openReadStream(storageKey)
        );

        return new StreamableFile(stream, {
            type: file.contentType,
            disposition: buildContentDisposition(file.name),
            length: file.size,
        });
    }

    async uploadFile(
        file: MulterUploadedFile | undefined,
        fileEncoding?: string
    ) {
        if (!file) {
            throw new AppException(FileErrors.REQUIRED);
        }

        const encoding = fileEncoding?.trim().toLowerCase();
        const isGzipEncoded = encoding === FILE_ENCODING_GZIP;

        if (encoding && !isGzipEncoded) {
            throw new AppException(FileErrors.INVALID_ENCODING, {
                details: {
                    encoding: fileEncoding,
                    allowedEncodings: [FILE_ENCODING_GZIP],
                },
            });
        }

        const storedBuffer = file.buffer;
        const contentBuffer = isGzipEncoded
            ? await gunzipBuffer(file.buffer)
            : file.buffer;

        const validated = validateUploadedFile({
            ...file,
            buffer: contentBuffer,
            size: contentBuffer.length,
        });

        await this.clamAvService.scanBuffer(validated.buffer);

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
        const storageKey = buildStoredFileName(
            validated.extension,
            isGzipEncoded
        );

        await this.fileStorageService.writeFile(storageKey, storedBuffer);

        let uploaded: FileSafe;

        try {
            uploaded = await this.filesRepository.create({
                ownerId,
                organizationId,
                name: validated.originalName,
                size: validated.size,
                contentType: validated.mimeType,
                checksum,
                storageKey,
                status: FileStatus.UPLOADED,
            });
        } catch (error) {
            await this.fileStorageService.remove(storageKey);
            throw error;
        }

        this.statusNotifier.notify({
            fileId: uploaded.id,
            organizationId,
            status: FileStatus.UPLOADED,
            error: null,
        });

        try {
            const job = {
                fileId: uploaded.id,
                storageKey: uploaded.storageKey,
                originalFilename: uploaded.name,
                contentType: uploaded.contentType,
                size: uploaded.size,
                organizationId: uploaded.organizationId,
                ownerId: uploaded.ownerId,
                publishedAt: new Date().toISOString(),
            };

            const extension = validated.extension
                .replace(/^\./, '')
                .toLowerCase();

            const aiDocumentExtensions =
                Object.values(AiDocumentExtensions).flat();

            if (FileExtensions.EXCEL.includes(extension)) {
                await this.fileProcessingPublisher.publishStorageFinalized(job);
            } else if (aiDocumentExtensions.includes(extension)) {
                await this.ragProcessingPublisher.publishStorageFinalized(job);
            } else {
                throw new Error(
                    `No worker route for file extension: .${extension}`
                );
            }
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to enqueue file for processing';

            uploaded = await this.filesRepository.updateStatus(uploaded.id, {
                status: FileStatus.FAILED,
                processingError: message,
            });

            this.statusNotifier.notify({
                fileId: uploaded.id,
                organizationId,
                status: FileStatus.FAILED,
                error: message,
            });

            this.logger.error(
                `[FilesService] publish failed fileId=${uploaded.id} ${message}`
            );
        }

        this.logger.log(
            `[FilesService] uploaded fileId=${uploaded.id} storageKey=${storageKey} originalSize=${validated.size} storedSize=${storedBuffer.length} encoding=${encoding ?? 'identity'} status=${uploaded.status}`
        );

        return uploaded;
    }

    async remove(id: string): Promise<null> {
        const file = await this.findById(id);

        if (file.status === FileStatus.PROCESSING) {
            throw new AppException(FileErrors.PROCESSING_IN_PROGRESS);
        }

        const remainingRefs = await this.filesRepository.countByStorageKey(
            file.storageKey,
            file.id
        );

        await this.filesRepository.deleteById(file.id);

        if (remainingRefs === 0) {
            await this.fileStorageService.remove(file.storageKey);
        }

        try {
            await this.ragDeletionPublisher.publishDelete({
                fileId: file.id,
            });
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to enqueue file delete';

            this.logger.error(
                `[FilesService] delete publish failed fileId=${file.id} ${message}`
            );
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
