import { AUTH_SCHEME } from '~/common/security/auth.types';

export function extractBearerToken(header?: string): string | undefined {
    if (!header) {
        return undefined;
    }

    const [scheme, value] = header.split(' ');

    if (
        scheme?.toLowerCase() !== AUTH_SCHEME.BEARER.toLowerCase() ||
        !value
    ) {
        return undefined;
    }

    return value;
}
