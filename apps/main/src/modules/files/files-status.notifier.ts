import { Injectable } from '@nestjs/common';

import { FILE_STATUS_WS_EVENT } from '~/shared/file-process-contract/constants';
import { FileStatus } from '~/generated/prisma/enums';
import { LoggerService } from '~/shared/logger';
import { FilesGateway } from '~/modules/files/files.gateway';

export type FileStatusNotification = {
    fileId: string;
    organizationId: string;
    status: FileStatus;
    error: string | null;
};

@Injectable()
export class FilesStatusNotifier {
    constructor(
        private readonly filesGateway: FilesGateway,
        private readonly logger: LoggerService
    ) {}

    notify(notification: FileStatusNotification): void {
        this.filesGateway.emitFileStatus(notification);
        this.logger.log(
            `[FilesStatusNotifier] ${FILE_STATUS_WS_EVENT} fileId=${notification.fileId} status=${notification.status}`
        );
    }
}
