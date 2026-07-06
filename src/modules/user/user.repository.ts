import { Injectable } from '@nestjs/common';

import { PrismaService } from '~/infrastructure/database/prisma.service';
import {
    UserSafe,
    userSelectAuth,
    userSelectSafe,
    UserWithPassword,
} from '~/common/types/user.types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersRepository {
    constructor(private readonly prisma: PrismaService) {}

    findAll(): Promise<UserSafe[]> {
        return this.prisma.user.findMany({
            select: userSelectSafe,
        });
    }

    findById(id: string): Promise<UserSafe | null> {
        return this.prisma.user.findUnique({
            where: { id },
            select: userSelectSafe,
        });
    }

    findByEmail(email: string): Promise<UserSafe | null> {
        return this.prisma.user.findUnique({
            where: { email },
            select: userSelectSafe,
        });
    }

    findByEmailForAuth(email: string): Promise<UserWithPassword | null> {
        return this.prisma.user.findFirst({
            where: {
                email,
                isDeleted: false,
            },
            select: userSelectAuth,
        });
    }

    create(
        dto: Omit<CreateUserDto, 'password'> & { password: string }
    ): Promise<UserSafe> {
        return this.prisma.user.create({
            data: dto,
            select: userSelectSafe,
        });
    }

    update(id: string, dto: UpdateUserDto): Promise<UserSafe> {
        return this.prisma.user.update({
            where: { id },
            data: dto,
            select: userSelectSafe,
        });
    }

    softDelete(id: string): Promise<UserSafe> {
        return this.prisma.user.update({
            where: { id },
            data: {
                isDeleted: true,
            },
            select: userSelectSafe,
        });
    }
}
