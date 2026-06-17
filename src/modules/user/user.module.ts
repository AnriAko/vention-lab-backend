import { Module } from '@nestjs/common';
import { PrismaModule } from '~/infrastructure/database/prisma.module';
import { UserController } from '~/modules/user/user.controller';
import { UserService } from '~/modules/user/user.service';

@Module({
    imports: [PrismaModule],
    controllers: [UserController],
    providers: [UserService],
})
export class UserModule {}
