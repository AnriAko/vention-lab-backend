import { Injectable } from '@nestjs/common';

import { AppException } from '~/common/errors/app-exception';
import type { Pagination } from '~/common/api/pagination/pagination.schema';
import { LoggerService } from '~/shared/logger';
import { MemberRepository } from './member.repository';
import { MemberErrors } from './member.errors';
import { UpdateMemberRoleDto } from './requests/update-member-role.request.dto';

@Injectable()
export class MemberService {
    constructor(
        private readonly memberRepository: MemberRepository,
        private readonly logger: LoggerService
    ) {}

    findAll(pagination: Pagination) {
        return this.memberRepository.findAll(pagination);
    }

    findAllDeleted(pagination: Pagination) {
        return this.memberRepository.findAllDeleted(pagination);
    }

    findAllAdmins(pagination: Pagination) {
        return this.memberRepository.findAllAdmins(pagination);
    }

    findById(userId: string) {
        return this.memberRepository.findById(userId);
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

        await this.memberRepository.softRemove(userId);

        this.logger.log(
            `[MemberService] soft-removed userId=${userId} from organization`
        );

        return null;
    }

    async restore(userId: string) {
        const member = await this.memberRepository.findDeletedById(userId);

        if (!member) {
            throw new AppException(MemberErrors.NOT_FOUND);
        }

        const restored = await this.memberRepository.restore(userId);

        this.logger.log(
            `[MemberService] restored userId=${userId} in organization`
        );

        return restored;
    }
}
