import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserIdDto } from './dto/user-id.dto';
import { Roles } from '~/common/decorators/roles.decorator';
import { UserRole } from '~/generated/prisma/enums';
import { OffsetPaginationDto } from '~/modules/user/dto/offset-pagination.dto';
import { CursorPaginationDto } from '~/modules/user/dto/cursor-pagination.dto';

@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) {}

    @Get()
    findAll() {
        return this.userService.findAll();
    }
    @Get('offset')
    findAllOffset(@Query() dto: OffsetPaginationDto) {
        return this.userService.findAllOffset(dto.page, dto.limit);
    }

    @Get('cursor')
    findAllCursor(@Query() dto: CursorPaginationDto) {
        return this.userService.findAllCursor(dto.cursor, dto.limit);
    }

    @Get(':id')
    findById(@Param() dto: UserIdDto) {
        return this.userService.findById(dto.id);
    }

    @Post()
    create(@Body() dto: CreateUserDto) {
        return this.userService.createUser(dto);
    }

    @Patch(':id')
    update(@Param() params: UserIdDto, @Body() dto: UpdateUserDto) {
        return this.userService.update(params.id, dto);
    }
    @Patch(':id/restore')
    restore(@Param() dto: UserIdDto) {
        return this.userService.restore(dto.id);
    }

    @Delete(':id')
    delete(@Param() dto: UserIdDto) {
        return this.userService.delete(dto.id);
    }
}
