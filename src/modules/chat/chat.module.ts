import { Module } from '@nestjs/common';

import { PrismaModule } from '~/infrastructure/database/prisma.module';

import { ChatRepository } from './chat.repository';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';

@Module({
    imports: [PrismaModule],
    providers: [ChatResolver, ChatService, ChatRepository],
    exports: [ChatService],
})
export class ChatModule {}
