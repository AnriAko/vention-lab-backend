import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserIdDto } from './dto/user-id.dto';
import { Roles } from '~/common/decorators/roles.decorator';
import { UserRole } from '~/generated/prisma/enums';

@Roles(UserRole.ADMIN)
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Roles(UserRole.USER)
    @Get()
    findAll() {
        return this.userService.findAll();
    }
    @Roles(UserRole.USER)
    @Get(':id')
    findById(@Param() dto: UserIdDto) {
        return this.userService.findById(dto.id);
    }

    @Post()
    create(@Body() dto: CreateUserDto) {
        return this.userService.create(dto);
    }

    @Put(':id')
    update(@Param() params: UserIdDto, @Body() dto: UpdateUserDto) {
        return this.userService.update(params.id, dto);
    }

    @Delete(':id')
    delete(@Param() dto: UserIdDto) {
        return this.userService.delete(dto.id);
    }
}
