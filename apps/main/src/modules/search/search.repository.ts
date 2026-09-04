import { Injectable } from '@nestjs/common';
import { SearchDto } from './requests/search.request.dto';
import { PrismaRlsClient } from '~/common/tenancy/rls/prisma-rls.client';
import { searchOrganizationsQuery, searchUsersQuery } from './search.query';
import { activeTenantSoftDeleteScope } from '~/infrastructure/database/scopes/organization-scope';
import { addWhere } from '~/infrastructure/database/scopes/addWhere';
import { userSelectSafe } from '~/infrastructure/database/selects/user.types';
import { SortDirection } from '~/common/api/pagination/sort-order.enum';

@Injectable()
export class SearchRepository {
    constructor(private readonly prisma: PrismaRlsClient) {}

    async searchUsers({ query, page, limit }: SearchDto) {
        const offset = (page - 1) * limit;

        return this.prisma.$queryRaw(searchUsersQuery(query, limit, offset));
    }

    async searchOrganizations({ query, page, limit }: SearchDto) {
        const offset = (page - 1) * limit;

        return this.prisma.$queryRaw(
            searchOrganizationsQuery(query, limit, offset)
        );
    }

    async substringUsers({ query, page, limit }: SearchDto) {
        const offset = (page - 1) * limit;

        return this.prisma.user.findMany({
            where: {
                OR: [
                    {
                        name: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                    {
                        email: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                ],
                organizations: {
                    some: {
                        isDeleted: false,
                    },
                },
            },
            skip: offset,
            take: limit,
            select: userSelectSafe,
        });
    }

    async searchOrganizationUsers({ query, page, limit }: SearchDto) {
        const offset = (page - 1) * limit;

        return this.prisma.user.findMany({
            where: addWhere(activeTenantSoftDeleteScope(), {
                OR: [
                    {
                        name: {
                            contains: query,
                            mode: 'insensitive' as const,
                        },
                    },
                    {
                        email: {
                            contains: query,
                            mode: 'insensitive' as const,
                        },
                    },
                ],
            }),
            skip: offset,
            take: limit,
            orderBy: {
                name: SortDirection.ASC,
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });
    }

    async substringOrganizations({ query, page, limit }: SearchDto) {
        const offset = (page - 1) * limit;

        return this.prisma.organization.findMany({
            where: {
                name: {
                    contains: query,
                    mode: 'insensitive',
                },
                isDeleted: false,
            },
            skip: offset,
            take: limit,
        });
    }
}
