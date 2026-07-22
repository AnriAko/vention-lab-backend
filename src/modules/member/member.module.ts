import { Module } from '@nestjs/common';

import { PrismaModule } from '~/infrastructure/database';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberRepository } from './member.repository';

@Module({
    imports: [PrismaModule],
    controllers: [MemberController],
    providers: [MemberService, MemberRepository],
    exports: [MemberService],
})
export class MemberModule {}
