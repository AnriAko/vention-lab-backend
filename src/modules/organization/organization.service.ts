import { Injectable } from '@nestjs/common';

import { LoggerService } from '~/infrastructure/logging/logger.service';

import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsRepository } from '~/modules/organization/organization.repository';
import { Organization } from '~/generated/prisma/client';

@Injectable()
export class OrganizationService {
    constructor(
        private readonly organizationRepository: OrganizationsRepository,
        private readonly logger: LoggerService
    ) {}

    async findAll(): Promise<Organization[]> {
        const organizations = await this.organizationRepository.findAll();

        this.logger.log(
            `[OrganizationService] fetched all organizations count=${organizations.length}`
        );

        return organizations;
    }

    async findById(id: string): Promise<Organization | null> {
        const organization = await this.organizationRepository.findById(id);

        this.logger.log(`[OrganizationService] fetched id=${id}`);

        return organization;
    }

    async create(dto: CreateOrganizationDto): Promise<Organization> {
        const organization = await this.organizationRepository.create(dto);

        this.logger.log(`[OrganizationService] created id=${organization.id}`);

        return organization;
    }

    async update(
        id: string,
        dto: UpdateOrganizationDto
    ): Promise<Organization> {
        const organization = await this.organizationRepository.update(id, dto);

        this.logger.log(`[OrganizationService] updated id=${id}`);

        return organization;
    }
    async restore(id: string): Promise<Organization> {
        const organization = await this.organizationRepository.restore(id);

        this.logger.log(`[OrganizationService] restored id=${id}`);

        return organization;
    }

    async delete(id: string): Promise<Organization> {
        const organization = await this.organizationRepository.softDelete(id);

        this.logger.log(`[OrganizationService] soft deleted id=${id}`);

        return organization;
    }
}
