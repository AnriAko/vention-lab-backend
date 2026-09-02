import { Injectable } from '@nestjs/common';

import { FileProcessStatus } from '~/shared/file-worker-contract/constants';
import type {
    FileProcessResultMessage,
    FileProcessUserTotal,
} from '~/shared/file-worker-contract/types';
import { AppRole } from '~/common/security/permissions/app-role.enum';
import { PrismaRlsService } from '~/common/tenancy/rls/prisma-rls.service';
import { FileStatus } from '~/generated/prisma/enums';
import { Prisma } from '~/generated/prisma/client';
import { LoggerService } from '~/shared/logger';
import { FilesStatusNotifier } from '~/modules/files/files-status.notifier';

type ApplyOutcome = {
    status: typeof FileStatus.COMPLETED | typeof FileStatus.FAILED;
    error: string | null;
};

type ResolvedTotal = {
    userId: string;
    amount: Prisma.Decimal;
};

@Injectable()
export class FileProcessingResultService {
    constructor(
        private readonly prismaRls: PrismaRlsService,
        private readonly statusNotifier: FilesStatusNotifier,
        private readonly logger: LoggerService
    ) {}

    async applyResult(result: FileProcessResultMessage): Promise<void> {
        if (result.status === FileProcessStatus.PROCESSING) {
            await this.markProcessing(result);
            this.statusNotifier.notify({
                fileId: result.fileId,
                organizationId: result.organizationId,
                status: FileStatus.PROCESSING,
                error: null,
            });
            return;
        }

        if (result.status === FileProcessStatus.FAILED || !result.success) {
            await this.markFailed(result, result.error ?? 'Processing failed');
            this.statusNotifier.notify({
                fileId: result.fileId,
                organizationId: result.organizationId,
                status: FileStatus.FAILED,
                error: result.error,
            });
            return;
        }

        if (result.status === FileProcessStatus.COMPLETED) {
            const outcome = await this.markCompleted(result);
            this.statusNotifier.notify({
                fileId: result.fileId,
                organizationId: result.organizationId,
                status: outcome.status,
                error: outcome.error,
            });
        }
    }

    private async markProcessing(
        result: FileProcessResultMessage
    ): Promise<void> {
        await this.withTenantTx(result, async (tx) => {
            await tx.file.updateMany({
                where: {
                    id: result.fileId,
                    organizationId: result.organizationId,
                    status: {
                        in: [FileStatus.UPLOADED, FileStatus.PROCESSING],
                    },
                },
                data: {
                    status: FileStatus.PROCESSING,
                    processingError: null,
                },
            });
        });
    }

    private async markFailed(
        result: FileProcessResultMessage,
        error: string
    ): Promise<void> {
        await this.withTenantTx(result, async (tx) => {
            const existing = await tx.file.findFirst({
                where: { id: result.fileId },
                select: { status: true },
            });

            if (
                !existing ||
                existing.status === FileStatus.COMPLETED ||
                existing.status === FileStatus.FAILED
            ) {
                return;
            }

            await this.setFileFailed(tx, result.fileId, error);
        });

        this.logger.log(
            `[FileProcessingResultService] FAILED fileId=${result.fileId}`
        );
    }

    private async markCompleted(
        result: FileProcessResultMessage
    ): Promise<ApplyOutcome> {
        return this.withTenantTx(result, async (tx) => {
            const early = await this.getCompletableFile(tx, result);
            if (early.kind === 'outcome') {
                return early.outcome;
            }

            const organization = await tx.organization.findFirst({
                where: {
                    id: result.organizationId,
                    isDeleted: false,
                },
                select: { id: true },
            });

            if (!organization) {
                return this.failDuringComplete(
                    tx,
                    result.fileId,
                    `Organization ${result.organizationId} does not exist`
                );
            }

            const resolved = await this.resolveUserTotals(
                tx,
                result.organizationId,
                result.totals ?? []
            );

            if ('error' in resolved) {
                return this.failDuringComplete(
                    tx,
                    result.fileId,
                    resolved.error
                );
            }

            await this.applyMoneySpent(
                tx,
                result.organizationId,
                resolved.entries
            );

            const updated = await tx.file.updateMany({
                where: {
                    id: result.fileId,
                    status: {
                        in: [FileStatus.UPLOADED, FileStatus.PROCESSING],
                    },
                },
                data: {
                    status: FileStatus.COMPLETED,
                    processingError: null,
                },
            });

            if (updated.count !== 1) {
                throw new Error(
                    `Could not complete file ${result.fileId} (status race)`
                );
            }

            this.logger.log(
                `[FileProcessingResultService] COMPLETED fileId=${result.fileId}`
            );

            return { status: FileStatus.COMPLETED, error: null };
        });
    }

    private async getCompletableFile(
        tx: Prisma.TransactionClient,
        result: FileProcessResultMessage
    ): Promise<{ kind: 'ok' } | { kind: 'outcome'; outcome: ApplyOutcome }> {
        const file = await tx.file.findFirst({
            where: {
                id: result.fileId,
                organizationId: result.organizationId,
            },
            select: { status: true },
        });

        if (!file) {
            return {
                kind: 'outcome',
                outcome: {
                    status: FileStatus.FAILED,
                    error: `File ${result.fileId} not found`,
                },
            };
        }

        if (file.status === FileStatus.COMPLETED) {
            return {
                kind: 'outcome',
                outcome: { status: FileStatus.COMPLETED, error: null },
            };
        }

        if (file.status === FileStatus.FAILED) {
            return {
                kind: 'outcome',
                outcome: { status: FileStatus.FAILED, error: result.error },
            };
        }

        return { kind: 'ok' };
    }

    private async resolveUserTotals(
        tx: Prisma.TransactionClient,
        organizationId: string,
        totals: FileProcessUserTotal[]
    ): Promise<{ entries: ResolvedTotal[] } | { error: string }> {
        const emails = totals.map((t) => t.userEmail.toLowerCase());
        const users = await tx.user.findMany({
            where: {
                email: { in: emails, mode: 'insensitive' },
            },
            select: { id: true, email: true },
        });

        const emailToUserId = new Map(
            users.map((u) => [u.email.toLowerCase(), u.id])
        );

        const entries: ResolvedTotal[] = [];

        for (const total of totals) {
            const email = total.userEmail.toLowerCase();
            const userId = emailToUserId.get(email);

            if (!userId) {
                return { error: `User not found for email: ${email}` };
            }

            const membership = await tx.usersOrganizations.findFirst({
                where: {
                    userId,
                    organizationId,
                    isDeleted: false,
                },
                select: { userId: true },
            });

            if (!membership) {
                return {
                    error: `User ${email} is not a member of organization ${organizationId}`,
                };
            }

            entries.push({
                userId,
                amount: new Prisma.Decimal(total.amount),
            });
        }

        return { entries };
    }

    private async applyMoneySpent(
        tx: Prisma.TransactionClient,
        organizationId: string,
        entries: ResolvedTotal[]
    ): Promise<void> {
        for (const entry of entries) {
            await tx.usersOrganizations.update({
                where: {
                    userId_organizationId: {
                        userId: entry.userId,
                        organizationId,
                    },
                },
                data: {
                    moneySpent: {
                        increment: entry.amount,
                    },
                },
            });
        }
    }

    private async failDuringComplete(
        tx: Prisma.TransactionClient,
        fileId: string,
        error: string
    ): Promise<ApplyOutcome> {
        await this.setFileFailed(tx, fileId, error);
        return { status: FileStatus.FAILED, error };
    }

    private async setFileFailed(
        tx: Prisma.TransactionClient,
        fileId: string,
        error: string
    ): Promise<void> {
        await tx.file.updateMany({
            where: { id: fileId },
            data: {
                status: FileStatus.FAILED,
                processingError: error.slice(0, 4000),
            },
        });
    }

    private async withTenantTx<T>(
        result: Pick<FileProcessResultMessage, 'ownerId' | 'organizationId'>,
        callback: (tx: Prisma.TransactionClient) => Promise<T>
    ): Promise<T> {
        return this.prismaRls.withTenant(
            {
                userId: result.ownerId,
                organizationId: result.organizationId,
                role: AppRole.ADMIN,
            },
            async () => {
                const tx = this.prismaRls.getTransaction();
                if (!tx) {
                    throw new Error('Missing RLS transaction');
                }
                return callback(tx);
            }
        );
    }
}
