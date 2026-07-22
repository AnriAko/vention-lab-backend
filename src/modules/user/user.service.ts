import { Injectable } from '@nestjs/common';

import { LoggerService } from '~/infrastructure/logging';
import type { Prisma } from '~/generated/prisma/client';
import { OrganizationRole } from '~/generated/prisma/enums';

import { CreateUserDto } from './requests/create-user.request.dto';
import { UpdateUserDto } from './requests/update-user.request.dto';
import { UserSafe } from '~/infrastructure/database';
import { UserRepository } from './user.repository';
import { Argon2Service } from '~/infrastructure/hashing';

@Injectable()
export class UsersService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly logger: LoggerService,
        private readonly argon2Service: Argon2Service
    ) {}

    existsById(id: string) {
        return this.userRepository.existsById(id);
    }

    getCurrentUser(): Promise<UserSafe | null> {
        return this.userRepository.findCurrentUser();
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
}
