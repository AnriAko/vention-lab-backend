import { Injectable } from '@nestjs/common';

import { PrismaRlsService } from '~/infrastructure/database/prisma-rls.service';

import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization, UserRole } from '~/generated/prisma/client';

@Injectable()
export class OrganizationsRepository {
    constructor(private readonly prismaRls: PrismaRlsService) {}

    findAll(): Promise<Organization[]> {
        return this.prismaRls.transaction((tx) =>
            tx.organization.findMany({
                where: {
                    isDeleted: false,
                },
            })
        );
    }

    findById(id: string): Promise<Organization | null> {
        return this.prismaRls.transaction((tx) =>
            tx.organization.findFirst({
                where: {
                    id,
                    isDeleted: false,
                },
            })
        );
    }

    async create(dto: CreateOrganizationDto) {
        return this.prismaRls.transaction(async (tx) => {
            const organization = await tx.organization.create({
                data: dto,
            });
            const owner = await tx.user.findFirst({
                where: {
                    role: UserRole.OWNER,
                },
                select: {
                    id: true,
                },
            });
            if (!owner) {
                throw new Error('Owner not found');
            }
            await tx.usersOrganizations.create({
                data: {
                    userId: owner.id,
                    organizationId: organization.id,
                    role: UserRole.OWNER,
                },
            });
            return organization;
        });
    }

    update(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
        return this.prismaRls.transaction((tx) =>
            tx.organization.update({
                where: { id },
                data: dto,
            })
        );
    }

    restore(id: string): Promise<Organization> {
        return this.prismaRls.transaction((tx) =>
            tx.organization.update({
                where: { id },
                data: {
                    isDeleted: false,
                },
            })
        );
    }

    softDelete(id: string): Promise<Organization> {
        return this.prismaRls.transaction((tx) =>
            tx.organization.update({
                where: { id },
                data: {
                    isDeleted: true,
                },
            })
        );
    }
}
