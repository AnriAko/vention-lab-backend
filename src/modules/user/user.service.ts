import { Injectable } from '@nestjs/common';

import { LoggerService } from '~/infrastructure/logging/logger.service';
import { Argon2Service } from '~/infrastructure/hashing/argon2.service';
import { RedisService } from '~/infrastructure/cache/redis.service';
import type { Prisma } from '~/generated/prisma/client';
import { OrganizationRole } from '~/generated/prisma/enums';

import { CreateUserDto } from './requests/create-user.request.dto';
import { UpdateUserDto } from './requests/update-user.request.dto';
import { UserSafe } from '~/common/types/user.types';
import { RedisPrefix } from '~/common/types/redis.types';
import { UserRepository } from '~/modules/user/user.repository';

@Injectable()
export class UsersService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly logger: LoggerService,
        private readonly argon2Service: Argon2Service,
        private readonly redisService: RedisService
    ) {}

    async findAll(page: number, limit: number) {
        const result = await this.userRepository.findAllOffset(page, limit);

        return {
            items: result.data,
            pagination: {
                page: result.meta.page,
                limit: result.meta.limit,
                total: result.meta.total,
            },
        };
    }

    findById(id: string) {
        return this.userRepository.findById(id);
    }

    existsById(id: string) {
        return this.userRepository.existsById(id);
    }

    getCurrentProfile() {
        return this.userRepository.findCurrentProfile();
    }

    findByEmail(email: string): Promise<UserSafe | null> {
        return this.userRepository.findByEmail(email);
    }

    async createUser(
        dto: CreateUserDto,
        transaction?: Prisma.TransactionClient,
        membershipRole: OrganizationRole = OrganizationRole.USER
    ) {
        const hashedPassword = await this.argon2Service.hashPassword(
            dto.password
        );

        const user = await this.userRepository.create(
            {
                ...dto,
                password: hashedPassword,
            },
            transaction,
            membershipRole
        );

        this.logger.log(`[UserService] created user id=${user.id}`);

        return user;
    }

    async update(id: string, dto: UpdateUserDto) {
        const user = await this.userRepository.update(id, dto);

        this.logger.log(`[UserService] updated user id=${id}`);

        return user;
    }

    async restore(id: string) {
        const user = await this.userRepository.restore(id);

        this.logger.log(`[UserService] restored user id=${id}`);

        return user;
    }

    async delete(id: string) {
        const user = await this.userRepository.softDelete(id);

        await this.redisService.del(RedisPrefix.REFRESH_TOKEN, id);

        this.logger.log(`[UserService] soft deleted user id=${id}`);

        return user;
    }
}
