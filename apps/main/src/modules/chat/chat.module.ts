import { Module } from '@nestjs/common';

import { WsAuthGuard } from '~/common/security/guards/ws-auth.guard';
import { WsOrganizationGuard } from '~/common/security/guards/ws-organization.guard';
import { WsRolesGuard } from '~/common/security/guards/ws-roles.guard';
import { RedisModule } from '~/infrastructure/cache/redis.module';
import { PrismaModule } from '~/infrastructure/database/prisma.module';

import { ChatWsExceptionFilter } from './chat-ws.exception-filter';
import { ChatGateway } from './chat.gateway';
import { ChatRepository } from './chat.repository';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';
import { WsRlsContext, WsRlsInterceptor } from './ws-rls-interceptor';

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
