import { Injectable } from '@nestjs/common';
import { SearchDto } from '~/modules/search/dto/search.dto';
import { PrismaService } from '~/infrastructure/database/prisma.service';
import {
    searchOrganizationsQuery,
    searchUsersQuery,
} from '~/modules/search/search.query';

@Injectable()
export class SearchRepository {
    constructor(private readonly prisma: PrismaService) {}

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
                isDeleted: false,
            },
            skip: offset,
            take: limit,
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
