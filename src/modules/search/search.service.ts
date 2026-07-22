import { Injectable } from '@nestjs/common';
import { SearchDto } from './requests/search.request.dto';
import { SearchRepository } from './search.repository';

@Injectable()
export class SearchService {
    constructor(private readonly repository: SearchRepository) {}

    async search(dto: SearchDto) {
        const [users, organizations] = await Promise.all([
            this.repository.searchUsers(dto),
            this.repository.searchOrganizations(dto),
        ]);

        return {
            users,
            organizations,
        };
    }

    async substringSearch(dto: SearchDto) {
        const [users, organizations] = await Promise.all([
            this.repository.substringUsers(dto),
            this.repository.substringOrganizations(dto),
        ]);

        return {
            users,
            organizations,
        };
    }
}
