import { SetMetadata } from '@nestjs/common';
import { SKIP_ORGANIZATION_KEY } from '~/common/decorators/constants';

/** Auth token lifecycle and similar routes that need a user but no org tenant. */
export const SkipOrganization = () => SetMetadata(SKIP_ORGANIZATION_KEY, true);
