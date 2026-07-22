import { Module } from '@nestjs/common';
import { PrismaModule } from '~/infrastructure/database';
import { Argon2Module } from '~/infrastructure/hashing';
import { UsersController } from './user.controller';
import { UserRepository } from './user.repository';
import { UsersService } from './user.service';

@Module({
    imports: [PrismaModule, Argon2Module],
    controllers: [UsersController],
    providers: [UsersService, UserRepository],
    exports: [UsersService],
})
export class UsersModule {}
