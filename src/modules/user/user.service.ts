import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/infrastructure/database/prisma.service';
import { LoggerService } from '~/infrastructure/logging/logger.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: LoggerService
    ) {}

    async findAll() {
        const users = await this.prisma.user.findMany();

        this.logger.log(
            `[UserService] fetched all users count=${users.length}`
        );

        return users;
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        this.logger.log(`[UserService] fetched user id=${id}`);

        return user;
    }

    async create(dto: CreateUserDto) {
        const user = await this.prisma.user.create({
            data: dto,
        });

        this.logger.log(`[UserService] created id=${user.id}`);

        return user;
    }

    async update(id: string, dto: UpdateUserDto) {
        const user = await this.prisma.user.update({
            where: { id },
            data: dto,
        });

        this.logger.log(`[UserService] updated id=${id}`);

        return user;
    }

    async delete(id: string) {
        const user = await this.prisma.user.delete({
            where: { id },
        });

        this.logger.log(`[UserService] deleted id=${id}`);

        return user;
    }
}
