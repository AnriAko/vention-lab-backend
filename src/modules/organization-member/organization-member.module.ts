import { Module } from '@nestjs/common';

import { PrismaModule } from '~/infrastructure/database/prisma.module';
import { OrganizationMemberController } from './organization-member.controller';
import { OrganizationMemberService } from './organization-member.service';
import { OrganizationMemberRepository } from './organization-member.repository';

@Module({
    imports: [PrismaModule],
    controllers: [OrganizationMemberController],
    providers: [OrganizationMemberService, OrganizationMemberRepository],
    exports: [OrganizationMemberService],
})
export class OrganizationMemberModule {}
