import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';

import { Roles } from '~/common/decorators/roles.decorator';
import { UserRole } from '~/generated/prisma/enums';

import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationIdDto } from './dto/organization-id.dto';

@Roles(UserRole.OWNER)
@Controller('organizations')
export class OrganizationController {
    constructor(private readonly organizationService: OrganizationService) {}

    @Get()
    findAll() {
        return this.organizationService.findAll();
    }

    @Get(':id')
    findById(@Param() dto: OrganizationIdDto) {
        return this.organizationService.findById(dto.id);
    }

    @Post()
    create(@Body() dto: CreateOrganizationDto) {
        return this.organizationService.create(dto);
    }

    @Patch(':id')
    update(
        @Param() params: OrganizationIdDto,
        @Body() dto: UpdateOrganizationDto
    ) {
        return this.organizationService.update(params.id, dto);
    }
    @Patch(':id/restore')
    restore(@Param() dto: OrganizationIdDto) {
        return this.organizationService.restore(dto.id);
    }

    @Delete(':id')
    delete(@Param() dto: OrganizationIdDto) {
        return this.organizationService.delete(dto.id);
    }
}
