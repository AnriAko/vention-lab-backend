import { Module } from '@nestjs/common';
import { WsAuthGuard } from '~/common/security/ws-security/ws-auth.guard';
import { WsOrganizationGuard } from '~/common/security/ws-security/ws-organization.guard';
import {
    WsRlsContext,
    WsRlsInterceptor,
} from '~/common/security/ws-security/ws-rls-interceptor';

@Module({
    providers: [
        WsAuthGuard,
        WsOrganizationGuard,
        WsRlsInterceptor,
        WsRlsContext,
    ],
    exports: [WsAuthGuard, WsOrganizationGuard, WsRlsInterceptor, WsRlsContext],
})
export class WsSecurityModule {}
