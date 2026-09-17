import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';

import {
    FILE_STATUS_WS_EVENT,
    FILE_STATUS_WS_NAMESPACE,
    FILE_STATUS_WS_ORG_ROOM_PREFIX,
    FILE_STATUS_WS_SUBSCRIBE_EVENT,
} from '@vention/file-process-contract/constants';
import { jwtConfig } from '~/config/configuration/jwt.config';
import { AUTH_HEADER, type JwtPayload } from '~/common/security/auth.types';
import { extractBearerToken } from '~/common/security/utils/extract-bearer-token';
import { LoggerService } from '@vention/shared-logger';
import type { FileStatusNotification } from '~/modules/files/files-status.notifier';

type SocketAuth = {
    token?: string;
    organizationId?: string;
};

@WebSocketGateway({
    namespace: FILE_STATUS_WS_NAMESPACE,
    cors: {
        origin: true,
        credentials: true,
    },
})
@Injectable()
export class FilesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    constructor(
        private readonly jwtService: JwtService,
        @Inject(jwtConfig.KEY)
        private readonly jwtConf: ConfigType<typeof jwtConfig>,
        private readonly logger: LoggerService
    ) {}

    async handleConnection(client: Socket): Promise<void> {
        try {
            const auth = (client.handshake.auth ?? {}) as SocketAuth;
            const token =
                auth.token ??
                extractBearerToken(
                    client.handshake.headers[AUTH_HEADER.AUTHORIZATION]
                );
            const organizationId =
                auth.organizationId ??
                (client.handshake.headers[AUTH_HEADER.ORGANIZATION_ID] as
                    string | undefined) ??
                (client.handshake.query.organizationId as string | undefined);

            if (!token || !organizationId) {
                client.disconnect(true);
                return;
            }

            const payload = await this.jwtService.verifyAsync<JwtPayload>(
                token,
                { secret: this.jwtConf.secret }
            );

            if (!payload?.sub) {
                client.disconnect(true);
                return;
            }

            client.data.userId = payload.sub;
            client.data.organizationId = organizationId;
            await client.join(this.orgRoom(organizationId));

            this.logger.log(
                `[FilesGateway] connected userId=${payload.sub} org=${organizationId} sid=${client.id}`
            );
        } catch (error) {
            this.logger.warn(
                `[FilesGateway] auth failed: ${error instanceof Error ? error.message : String(error)}`
            );
            client.disconnect(true);
        }
    }

    handleDisconnect(client: Socket): void {
        this.logger.log(`[FilesGateway] disconnected sid=${client.id}`);
    }

    @SubscribeMessage(FILE_STATUS_WS_SUBSCRIBE_EVENT)
    handleSubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: { organizationId?: string }
    ): { ok: boolean } {
        const organizationId =
            body?.organizationId ??
            (client.data.organizationId as string | undefined);

        if (!organizationId) {
            return { ok: false };
        }

        void client.join(this.orgRoom(organizationId));
        client.data.organizationId = organizationId;
        return { ok: true };
    }

    emitFileStatus(notification: FileStatusNotification): void {
        if (!this.server) {
            return;
        }

        this.server
            .to(this.orgRoom(notification.organizationId))
            .emit(FILE_STATUS_WS_EVENT, {
                fileId: notification.fileId,
                status: notification.status,
                error: notification.error,
            });
    }

    private orgRoom(organizationId: string): string {
        return `${FILE_STATUS_WS_ORG_ROOM_PREFIX}${organizationId}`;
    }
}
