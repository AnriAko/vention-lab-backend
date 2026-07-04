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

    async findAll(): Promise<UserSafe[]> {
        const users = await this.userRepository.findAll();

        this.logger.log(
            `[UserService] fetched all users count=${users.length}`
        );

        return users;
    }

    async findById(id: string): Promise<UserSafe | null> {
        const user = await this.userRepository.findById(id);

        this.logger.log(`[UserService] fetched user id=${id}`);

        return user;
    }

    findByEmail(email: string): Promise<UserSafe | null> {
        return this.userRepository.findByEmail(email);
    }

    findByEmailForAuth(email: string): Promise<UserWithPassword | null> {
        return this.userRepository.findByEmailForAuth(email);
    }
    async findAllAdmins(): Promise<UserSafe[]> {
        const admins = await this.userRepository.findAllAdmins();

        this.logger.log(
            `[UserService] fetched all admins count=${admins.length}`
        );

        return admins;
    }
    async createUser(dto: CreateUserDto): Promise<UserSafe> {
        const hashedPassword = await this.argon2Service.hashPassword(
            dto.password
        );

        const user = await this.userRepository.create({
            ...dto,
            password: hashedPassword,
        });

        this.logger.log(`[UserService] created id=${user.id}`);

        return user;
    }
    async createAdmin(dto: CreateUserDto): Promise<UserSafe> {
        const hashedPassword = await this.argon2Service.hashPassword(
            dto.password
        );

        return this.userRepository.create(
            {
                ...dto,
                password: hashedPassword,
            },
            UserRole.ADMIN
        );
    }

    async update(id: string, dto: UpdateUserDto): Promise<UserSafe> {
        const user = await this.userRepository.update(id, dto);

        this.logger.log(`[UserService] updated id=${id}`);

        return user;
    }

    async delete(id: string): Promise<UserSafe> {
        const user = await this.userRepository.softDelete(id);

        await this.redisService.del(RedisPrefix.REFRESH_TOKEN, id);

        this.logger.log(`[UserService] soft deleted id=${id}`);

        return user;
    }
}
