import { Injectable } from '@nestjs/common';
import { SearchDto } from '~/modules/search/dto/search.dto';
import { PrismaRlsService } from '~/infrastructure/database/prisma-rls.service';
import {
    searchOrganizationsQuery,
    searchUsersQuery,
} from '~/modules/search/search.query';
import { userSelectSafe } from '~/common/types/user.types';

@Injectable()
export class SearchRepository {
    constructor(private readonly prismaRls: PrismaRlsService) {}

    async searchUsers({ query, page, limit }: SearchDto) {
        const offset = (page - 1) * limit;

        return this.prismaRls.transaction((tx) =>
            tx.$queryRaw(searchUsersQuery(query, limit, offset))
        );
    }

    async searchOrganizations({ query, page, limit }: SearchDto) {
        const offset = (page - 1) * limit;

        return this.prismaRls.transaction((tx) =>
            tx.$queryRaw(searchOrganizationsQuery(query, limit, offset))
        );
    }

    async substringUsers({ query, page, limit }: SearchDto) {
        const offset = (page - 1) * limit;

        return this.prismaRls.transaction((tx) =>
            tx.user.findMany({
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
                    isDeleted: false,
                },
                skip: offset,
                take: limit,
                select: userSelectSafe,
            })
        );
    }

    async substringOrganizations({ query, page, limit }: SearchDto) {
        const offset = (page - 1) * limit;

        return this.prismaRls.transaction((tx) =>
            tx.organization.findMany({
                where: {
                    name: {
                        contains: query,
                        mode: 'insensitive',
                    },
                    isDeleted: false,
                },
                skip: offset,
                take: limit,
            })
        );
    }
}
