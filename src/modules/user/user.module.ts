import { Module } from '@nestjs/common';
import { PrismaModule } from '~/infrastructure/database/prisma.module';
import { Argon2Module } from '~/infrastructure/hashing/argon2.module';
import { UsersController } from '~/modules/user/user.controller';
import { UsersService } from '~/modules/user/user.service';

@Module({
    imports: [PrismaModule, Argon2Module],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule {}
