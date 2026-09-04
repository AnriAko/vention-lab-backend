import { Injectable } from '@nestjs/common';

import { paginatePrisma } from '~/common/api/pagination/paginate-prisma';
import type { Pagination } from '~/common/api/pagination/pagination.schema';
import { SortDirection } from '~/common/api/pagination/sort-order.enum';
import { PrismaRlsClient } from '~/common/tenancy/rls/prisma-rls.client';
import { addWhere } from '~/infrastructure/database/scopes/addWhere';
import { activeTenantScope } from '~/infrastructure/database/scopes/organization-scope';
import { fileSelect } from '~/infrastructure/database/selects/file.types';
import { FileStatus } from '~/generated/prisma/enums';
import type { FileSafe } from '~/infrastructure/database/selects/file.types';

export type CreateFileData = {
    ownerId: string;
    organizationId: string;
    name: string;
    size: number;
    contentType: string;
    checksum: string;
    storageKey: string;
    status?: FileStatus;
};

@Injectable()
export class FilesRepository {
    constructor(private readonly prisma: PrismaRlsClient) {}

    findAll(pagination: Pagination) {
        return paginatePrisma({
            pagination,
            model: this.prisma.file,
            where: activeTenantScope(),
            select: fileSelect,
            orderBy: {
                name: SortDirection.ASC,
            },
        });
    }

    findById(id: string) {
        return this.prisma.file.findFirst({
            where: addWhere(activeTenantScope(), { id }),
            select: fileSelect,
        });
    }

    findByChecksum(checksum: string) {
        return this.prisma.file.findFirst({
            where: addWhere(activeTenantScope(), { checksum }),
            select: fileSelect,
        });
    }

    create(data: CreateFileData) {
        return this.prisma.file.create({
            data: {
                ownerId: data.ownerId,
                organizationId: data.organizationId,
                name: data.name,
                size: data.size,
                contentType: data.contentType,
                checksum: data.checksum,
                storageKey: data.storageKey,
                status: data.status ?? FileStatus.UPLOADED,
            },
            select: fileSelect,
        });
    }

    updateStatus(
        id: string,
        data: {
            status: FileStatus;
            processingError?: string | null;
        }
    ): Promise<FileSafe> {
        return this.prisma.file.update({
            where: { id },
            data: {
                status: data.status,
                processingError:
                    data.processingError === undefined
                        ? undefined
                        : data.processingError,
            },
            select: fileSelect,
        });
    }

    countByStorageKey(storageKey: string, excludeId?: string) {
        return this.prisma.file.count({
            where: addWhere(activeTenantScope(), {
                storageKey,
                ...(excludeId ? { id: { not: excludeId } } : {}),
            }),
        });
    }

    async deleteById(id: string) {
        const result = await this.prisma.file.deleteMany({
            where: addWhere(activeTenantScope(), { id }),
        });

        return result.count;
    }
}
