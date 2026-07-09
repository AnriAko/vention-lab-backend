import { Injectable } from '@nestjs/common';

import { LoggerService } from '~/infrastructure/logging/logger.service';
import { Argon2Service } from '~/infrastructure/hashing/argon2.service';
import { RedisService } from '~/infrastructure/cache/redis.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserSafe, UserWithPassword } from '~/common/types/user.types';
import { RedisPrefix } from '~/common/types/redis.types';
import { UsersRepository } from '~/modules/user/user.repository';
import { UserRole } from '~/generated/prisma/enums';

@Injectable()
export class UsersService {
    constructor(
        private readonly userRepository: UsersRepository,
        private readonly logger: LoggerService,
        private readonly argon2Service: Argon2Service,
        private readonly redisService: RedisService
    ) {}

    findAll(): Promise<UserSafe[]> {
        return this.userRepository.findAll();
    }

    findById(id: string): Promise<UserSafe | null> {
        return this.userRepository.findById(id);
    }
    findAllOffset(page: number, limit: number) {
        return this.userRepository.findAllOffset(page, limit);
    }

    async findAllCursor(cursor?: string, limit = 20) {
        const decodedCursor = cursor
            ? JSON.parse(Buffer.from(cursor, 'base64').toString())
            : undefined;

        const result = await this.userRepository.findAllCursor(
            decodedCursor,
            limit
        );

        return {
            data: result.data,

            meta: {
                nextCursor: result.nextCursor
                    ? Buffer.from(JSON.stringify(result.nextCursor)).toString(
                          'base64'
                      )
                    : null,

                hasNextPage: result.hasNextPage,
            },
        };
    }

    findByEmail(email: string): Promise<UserSafe | null> {
        return this.userRepository.findByEmail(email);
    }

    findByEmailForAuth(email: string): Promise<UserWithPassword | null> {
        return this.userRepository.findByEmailForAuth(email);
    }

    findAllAdmins(): Promise<UserSafe[]> {
        return this.userRepository.findAllAdmins();
    }

    async createUser(dto: CreateUserDto): Promise<UserSafe> {
        const hashedPassword = await this.argon2Service.hashPassword(
            dto.password
        );

        const user = await this.userRepository.create({
            ...dto,
            password: hashedPassword,
        });

        this.logger.log(`[UserService] created user id=${user.id}`);

        return user;
    }

    async createAdmin(dto: CreateUserDto): Promise<UserSafe> {
        const hashedPassword = await this.argon2Service.hashPassword(
            dto.password
        );

        const user = await this.userRepository.create(
            {
                ...dto,
                password: hashedPassword,
            },
            UserRole.ADMIN
        );

        this.logger.log(`[UserService] created admin id=${user.id}`);

        return user;
    }

    async update(id: string, dto: UpdateUserDto): Promise<UserSafe> {
        const user = await this.userRepository.update(id, dto);

        this.logger.log(`[UserService] updated user id=${id}`);

        return user;
    }

    async restore(id: string): Promise<UserSafe> {
        const user = await this.userRepository.restore(id);

        this.logger.log(`[UserService] restored user id=${id}`);

        return user;
    }

    async delete(id: string): Promise<UserSafe> {
        const user = await this.userRepository.softDelete(id);

        await this.redisService.del(RedisPrefix.REFRESH_TOKEN, id);

        this.logger.log(`[UserService] soft deleted user id=${id}`);

        return user;
    }
}
