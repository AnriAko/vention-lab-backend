import { Injectable } from '@nestjs/common';

import { PrismaService } from '~/infrastructure/database/prisma.service';

import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization } from '~/generated/prisma/client';

@Injectable()
export class OrganizationsRepository {
    constructor(private readonly prisma: PrismaService) {}

    findAll(): Promise<Organization[]> {
        return this.prisma.organization.findMany({
            where: {
                isDeleted: false,
            },
        });
    }

    findById(id: string): Promise<Organization | null> {
        return this.prisma.organization.findFirst({
            where: {
                id,
                isDeleted: false,
            },
        });
    }

    create(dto: CreateOrganizationDto): Promise<Organization> {
        return this.prisma.organization.create({
            data: dto,
        });
    }

    update(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
        return this.prisma.organization.update({
            where: { id },
            data: dto,
        });
    }
    restore(id: string): Promise<Organization> {
        return this.prisma.organization.update({
            where: { id },
            data: {
                isDeleted: false,
            },
        });
    }

    softDelete(id: string): Promise<Organization> {
        return this.prisma.organization.update({
            where: { id },
            data: {
                isDeleted: true,
            },
        });
    }
}
