import { Module } from '@nestjs/common';
import { PrismaModule } from '~/infrastructure/database/prisma.module';
import { Argon2Module } from '~/infrastructure/hashing/argon2.module';
import { UserController } from '~/modules/user/user.controller';
import { UserService } from '~/modules/user/user.service';

@Module({
    imports: [PrismaModule, Argon2Module],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
