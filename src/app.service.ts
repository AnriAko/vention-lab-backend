import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './config/env.schema';

@Injectable()
export class AppService {
    constructor(private readonly configService: ConfigService) {}

    getHello(): string {
        const appCfg = this.configService.get<AppConfig>('app');
        return `Hello World! (port: ${appCfg?.port ?? 'unknown'})`;
    }
}
