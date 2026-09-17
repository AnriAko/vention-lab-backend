import { Module } from '@nestjs/common';

import { WsAuthGuard } from '~/common/security/ws-security/ws-auth.guard';
import { WsOrganizationGuard } from '~/common/security/ws-security/ws-organization.guard';
import { WsRolesGuard } from '~/common/security/ws-security/ws-roles.guard';
import { RedisModule } from '~/infrastructure/cache/redis.module';
import { PrismaModule } from '~/infrastructure/database/prisma.module';

import { ChatWsExceptionFilter } from './chat-ws.exception-filter';
import { ChatGateway } from './chat.gateway';
import { ChatRepository } from './chat.repository';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';
import {
    WsRlsContext,
    WsRlsInterceptor,
} from '../../common/security/ws-security/ws-rls-interceptor';

@Module({
    imports: [PrismaModule, RedisModule],
    providers: [
        ChatResolver,
        ChatService,
        ChatRepository,
        ChatGateway,
        ChatWsExceptionFilter,
        WsAuthGuard,
        WsOrganizationGuard,
        WsRolesGuard,
        WsRlsContext,
        WsRlsInterceptor,
    ],
    exports: [ChatService],
})
export class ChatModule {}
