import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/infrastructure/database/prisma.service';
import { LoggerService } from '~/infrastructure/logging/logger.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Argon2Service } from '~/infrastructure/hashing/argon2.service';

const userSelectSafe = {
    id: true,
    email: true,
    name: true,
    role: true,
};

const userSelectAuth = {
    ...userSelectSafe,
    password: true,
};

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: LoggerService,
        private readonly argon2Service: Argon2Service
    ) {}

    async findAll() {
        const users = await this.prisma.user.findMany({
            select: userSelectSafe,
        });

        this.logger.log(
            `[UserService] fetched all users count=${users.length}`
        );

        return users;
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: userSelectSafe,
        });

        this.logger.log(`[UserService] fetched user id=${id}`);

        return user;
    }

    async findByEmail(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: userSelectSafe,
        });

        return user;
    }

    async findByEmailForAuth(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: userSelectAuth,
        });

        return user;
    }

    async create(dto: CreateUserDto) {
        const userWithHashedPassword = {
            ...dto,
            password: await this.argon2Service.hashPassword(dto.password),
        };
        const user = await this.prisma.user.create({
            data: userWithHashedPassword,
            select: userSelectSafe,
        });

        this.logger.log(`[UserService] created id=${user.id}`);

        return user;
    }

    async update(id: string, dto: UpdateUserDto) {
        const user = await this.prisma.user.update({
            where: { id },
            data: dto,
            select: userSelectSafe,
        });

        this.logger.log(`[UserService] updated id=${id}`);

        return user;
    }

    async delete(id: string) {
        const user = await this.prisma.user.delete({
            where: { id },
            select: userSelectSafe,
        });

        this.logger.log(`[UserService] deleted id=${id}`);

        return user;
    }
}
