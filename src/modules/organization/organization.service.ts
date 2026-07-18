import { Injectable } from '@nestjs/common';

import { AppException } from '~/common/errors';
import { LoggerService } from '~/infrastructure/logging/logger.service';
import { requestContext } from '~/infrastructure/context/request-context';
import { UsersService } from '~/modules/user/user.service';
import { UserErrors } from '~/modules/user/user.errors';
import { OrganizationRole } from '~/generated/prisma/client';

import { CreateOrganizationDto } from './requests/create-organization.request.dto';
import { CreateOrganizationWithAdminDto } from './requests/create-organization-with-admin.request.dto';
import { UpdateOrganizationDto } from './requests/update-organization.request.dto';
import { OrganizationsRepository } from './organization.repository';

@Injectable()
export class OrganizationService {
    constructor(
        private readonly organizationRepository: OrganizationsRepository,
        private readonly usersService: UsersService,
        private readonly logger: LoggerService
    ) {}

    async findAll(page: number, limit: number) {
        const result = await this.organizationRepository.findAllOffset(
            page,
            limit
        );
        return {
            items: result.data,
            pagination: result.meta,
        };
    }

    async findAllDeleted(page: number, limit: number) {
        const result = await this.organizationRepository.findAllDeletedOffset(
            page,
            limit
        );
        return {
            items: result.data,
            pagination: result.meta,
        };
    }

    findById(id: string) {
        return this.organizationRepository.findById(id);
    }

    async findAllForCurrentUser(page: number, limit: number) {
        const userId = requestContext.getStore()?.userId;
        if (!userId) {
            throw new Error('Missing user context');
        }

        return this.findAllByUserId(userId, page, limit);
    }

    async findAllByUserId(userId: string, page: number, limit: number) {
        const userExists = await this.usersService.existsById(userId);

        if (!userExists) {
            throw new AppException(UserErrors.NOT_FOUND);
        }

        const result = await this.organizationRepository.findAllByUserIdOffset(
            userId,
            page,
            limit
        );

        return {
            items: result.data,
            pagination: result.meta,
        };
    }

    async create(dto: CreateOrganizationDto) {
        const userExists = await this.usersService.existsById(dto.userId);

        if (!userExists) {
            throw new AppException(UserErrors.NOT_FOUND);
        }

        const organization = await this.organizationRepository.create(dto);

        this.logger.log(
            `[OrganizationService] created with admin userId=${dto.userId} id=${organization.id}`
        );

        return organization;
    }

    async createWithAdmin(dto: CreateOrganizationWithAdminDto) {
        const result = await this.organizationRepository.createWithAdmin(
            dto.organizationName,
            (transaction, organizationId) =>
                this.usersService.createUser(
                    {
                        email: dto.adminsEmail,
                        name: dto.adminsName,
                        password: dto.adminsPassword,
                        organizationId,
                    },
                    transaction,
                    OrganizationRole.ADMIN
                )
        );

        this.logger.log(
            `[OrganizationService] created with new admin userId=${result.user.id} id=${result.organization.id}`
        );

        return result;
    }

    async update(id: string, dto: UpdateOrganizationDto) {
        const organization = await this.organizationRepository.update(id, dto);
        this.logger.log(`[OrganizationService] updated id=${id}`);
        return organization;
    }

    async restore(id: string) {
        const organization = await this.organizationRepository.restore(id);
        this.logger.log(`[OrganizationService] restored id=${id}`);
        return organization;
    }

    async delete(id: string) {
        const organization = await this.organizationRepository.softDelete(id);
        this.logger.log(`[OrganizationService] soft deleted id=${id}`);
        return organization;
    }
}
