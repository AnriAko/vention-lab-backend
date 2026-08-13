import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { OrganizationsRepository } from './organization.repository';
import { PrismaModule } from '~/infrastructure/database/prisma.module';
import { UsersModule } from '~/modules/user/user.module';

@Module({
    imports: [PrismaModule, UsersModule],
    controllers: [OrganizationController],
    providers: [OrganizationService, OrganizationsRepository],
})
export class OrganizationModule {}
