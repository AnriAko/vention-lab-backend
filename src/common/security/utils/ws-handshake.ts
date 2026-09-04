import { AUTH_HEADER } from '~/common/security/auth.types';
import type { AuthUser } from '~/common/security/auth.types';
import { extractBearerToken } from '~/common/security/utils/extract-bearer-token';
import type { WsHandshakeClient } from '~/common/security/ws-client.types';

type SocketHandshakeAuth = {
    token?: string;
    organizationId?: string;
    organizationRole?: string;
};

function firstString(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) {
        return value[0];
    }

    return value;
}

export function extractWsAccessToken(
    client: WsHandshakeClient
): string | undefined {
    const auth = (client.handshake.auth ?? {}) as SocketHandshakeAuth;

    return (
        auth.token ??
        extractBearerToken(
            firstString(client.handshake.headers[AUTH_HEADER.AUTHORIZATION])
        )
    );
}

export function extractWsOrganizationId(
    client: WsHandshakeClient
): string | undefined {
    const auth = (client.handshake.auth ?? {}) as SocketHandshakeAuth;

    return (
        auth.organizationId ??
        firstString(client.handshake.headers[AUTH_HEADER.ORGANIZATION_ID]) ??
        firstString(client.handshake.query.organizationId)
    );
}

export function extractWsOrganizationRole(
    client: WsHandshakeClient
): string | undefined {
    const auth = (client.handshake.auth ?? {}) as SocketHandshakeAuth;

    return (
        auth.organizationRole ??
        firstString(client.handshake.headers[AUTH_HEADER.ORGANIZATION_ROLE])
    );
}

export function getWsClientUser(
    client: WsHandshakeClient
): AuthUser | undefined {
    return client.data.user;
}

export function setWsClientUser(
    client: WsHandshakeClient,
    user: AuthUser
): void {
    client.data.user = user;
}
