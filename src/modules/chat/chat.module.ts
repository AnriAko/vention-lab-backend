import { Module } from '@nestjs/common';

import { RedisModule } from '~/infrastructure/cache/redis.module';
import { PrismaModule } from '~/infrastructure/database/prisma.module';

import { ChatGateway } from './chat.gateway';
import { ChatRepository } from './chat.repository';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';

@Module({
    imports: [PrismaModule, RedisModule],
    providers: [ChatResolver, ChatService, ChatRepository, ChatGateway],
    exports: [ChatService],
})
export class ChatModule {}
