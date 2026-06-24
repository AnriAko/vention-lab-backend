import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '~/common/decorators/constants';
import { UserRole } from '~/generated/prisma/enums';

export const Roles = (...roles: UserRole[]) =>
    SetMetadata(ROLES_KEY, roles.length ? roles : [UserRole.USER]);
