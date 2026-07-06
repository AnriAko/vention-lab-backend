import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { OrganizationsRepository } from '~/modules/organization/organization.repository';
import { PrismaModule } from '~/infrastructure/database/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [OrganizationController],
    providers: [OrganizationService, OrganizationsRepository],
})
export class OrganizationModule {}
