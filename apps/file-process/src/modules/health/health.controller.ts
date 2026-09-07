import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import {
    HEALTH_CHECK_PATTERN,
    type HealthCheckResult,
} from '@vention/health-contract';

@Controller()
export class HealthController {
    @MessagePattern(HEALTH_CHECK_PATTERN)
    check(): HealthCheckResult {
        return { status: 'up', service: 'file-process' };
    }
}
