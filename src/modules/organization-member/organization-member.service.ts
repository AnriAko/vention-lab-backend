import { Injectable } from '@nestjs/common';

import { AppException } from '~/common/errors';
import { LoggerService } from '~/infrastructure/logging/logger.service';
import { OrganizationMemberRepository } from './organization-member.repository';
import { OrganizationMemberErrors } from './organization-member.errors';
import { UpdateMemberRoleDto } from './requests/update-member-role.request.dto';

@Injectable()
export class OrganizationMemberService {
    constructor(
        private readonly organizationMemberRepository: OrganizationMemberRepository,
        private readonly logger: LoggerService
    ) {}

    async findAll(page: number, limit: number) {
        const result = await this.organizationMemberRepository.findAllOffset(
            page,
            limit
        );
        return {
            items: result.data,
            pagination: result.meta,
        };
    }

    async findAllDeleted(page: number, limit: number) {
        const result =
            await this.organizationMemberRepository.findAllDeletedOffset(
                page,
                limit
            );
        return {
            items: result.data,
            pagination: result.meta,
        };
    }

    async findAllAdmins(page: number, limit: number) {
        const result =
            await this.organizationMemberRepository.findAllAdminsOffset(
                page,
                limit
            );
        return {
            items: result.data,
            pagination: result.meta,
        };
    }

    async assignRole(userId: string, dto: UpdateMemberRoleDto) {
        const member = await this.organizationMemberRepository.assignRole(
            userId,
            dto.role
        );

        this.logger.log(
            `[OrganizationMemberService] assigned role=${dto.role} userId=${userId}`
        );

        return member;
    }

    async remove(userId: string): Promise<null> {
        const member = await this.organizationMemberRepository.findById(userId);

        if (!member) {
            throw new AppException(OrganizationMemberErrors.NOT_FOUND);
        }

        await this.organizationMemberRepository.remove(userId);

        this.logger.log(`[OrganizationMemberService] removed userId=${userId}`);

        return null;
    }
}
