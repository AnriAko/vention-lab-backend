import type { UserRole } from '~/generated/prisma/enums';

export type AuthResponseDto = {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    image: string;
    accessToken: string;
};
