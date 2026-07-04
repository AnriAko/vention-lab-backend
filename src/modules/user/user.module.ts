import { Module } from '@nestjs/common';
import { RedisModule } from '~/infrastructure/cache/redis.module';
import { PrismaModule } from '~/infrastructure/database/prisma.module';
import { Argon2Module } from '~/infrastructure/hashing/argon2.module';
import { AdminController } from '~/modules/user/admin.controller';
import { UsersController } from '~/modules/user/user.controller';
import { UsersRepository } from '~/modules/user/user.repository';
import { UsersService } from '~/modules/user/user.service';

@Module({
    imports: [PrismaModule, Argon2Module, RedisModule],
    controllers: [UsersController, AdminController],
    providers: [UsersService, UsersRepository],
    exports: [UsersService],
})
export class UsersModule {}
