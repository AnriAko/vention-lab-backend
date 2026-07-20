import { Injectable } from '@nestjs/common';

import { AppException } from '~/common/errors';
import { LoggerService } from '~/infrastructure/logging/logger.service';
import { MemberRepository } from './member.repository';
import { MemberErrors } from './member.errors';
import { UpdateMemberRoleDto } from './requests/update-member-role.request.dto';

@Injectable()
export class MemberService {
    constructor(
        private readonly memberRepository: MemberRepository,
        private readonly logger: LoggerService
    ) {}

    async findAll(page: number, limit: number) {
        const result = await this.memberRepository.findAllOffset(page, limit);
        return {
            items: result.data,
            pagination: result.meta,
        };
    }

    async findAllDeleted(page: number, limit: number) {
        const result = await this.memberRepository.findAllDeletedOffset(
            page,
            limit
        );
        return {
            items: result.data,
            pagination: result.meta,
        };
    }

    async findAllAdmins(page: number, limit: number) {
        const result = await this.memberRepository.findAllAdminsOffset(
            page,
            limit
        );
        return {
            items: result.data,
            pagination: result.meta,
        };
    }

    async assignRole(userId: string, dto: UpdateMemberRoleDto) {
        const member = await this.memberRepository.assignRole(userId, dto.role);

        this.logger.log(
            `[MemberService] assigned role=${dto.role} userId=${userId}`
        );

        return member;
    }

    async remove(userId: string): Promise<null> {
        const member = await this.memberRepository.findById(userId);

        if (!member) {
            throw new AppException(MemberErrors.NOT_FOUND);
        }

        await this.memberRepository.remove(userId);

        this.logger.log(`[MemberService] removed userId=${userId}`);

        return null;
    }
}
