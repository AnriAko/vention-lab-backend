import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserIdDto } from './dto/user-id.dto';
import { Roles } from '~/common/decorators/roles.decorator';
import { UserRole } from '~/generated/prisma/enums';

@Roles(UserRole.OWNER)
@Controller('admins')
export class AdminController {
    constructor(private readonly userService: UsersService) {}

    @Get()
    findAll() {
        return this.userService.findAllAdmins();
    }

    @Get(':id')
    findById(@Param() dto: UserIdDto) {
        return this.userService.findById(dto.id);
    }

    // @PublicRoute()
    @Post()
    create(@Body() dto: CreateUserDto) {
        return this.userService.createAdmin(dto);
    }

    @Patch(':id')
    update(@Param() params: UserIdDto, @Body() dto: UpdateUserDto) {
        return this.userService.update(params.id, dto);
    }

    @Delete(':id')
    delete(@Param() dto: UserIdDto) {
        return this.userService.delete(dto.id);
    }
}
