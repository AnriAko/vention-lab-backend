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

    async findAll(organizationId: string, page: number, limit: number) {
        const result = await this.organizationMemberRepository.findAllOffset(
            organizationId,
            page,
            limit
        );
        return {
            items: result.data,
            pagination: result.meta,
        };
    }

    async findAllDeleted(organizationId: string, page: number, limit: number) {
        const result =
            await this.organizationMemberRepository.findAllDeletedOffset(
                organizationId,
                page,
                limit
            );
        return {
            items: result.data,
            pagination: result.meta,
        };
    }

    async findAllAdmins(organizationId: string, page: number, limit: number) {
        const result =
            await this.organizationMemberRepository.findAllAdminsOffset(
                organizationId,
                page,
                limit
            );
        return {
            items: result.data,
            pagination: result.meta,
        };
    }

    async assignRole(
        organizationId: string,
        userId: string,
        dto: UpdateMemberRoleDto
    ) {
        const member = await this.organizationMemberRepository.assignRole(
            organizationId,
            userId,
            dto.role
        );

        this.logger.log(
            `[OrganizationMemberService] assigned role=${dto.role} userId=${userId} organizationId=${organizationId}`
        );

        return member;
    }

    async remove(organizationId: string, userId: string): Promise<null> {
        const member = await this.organizationMemberRepository.findById(
            organizationId,
            userId
        );

        if (!member) {
            throw new AppException(OrganizationMemberErrors.NOT_FOUND);
        }

        await this.organizationMemberRepository.remove(organizationId, userId);

        this.logger.log(
            `[OrganizationMemberService] removed userId=${userId} organizationId=${organizationId}`
        );

        return null;
    }
}
