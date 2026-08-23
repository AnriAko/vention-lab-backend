import { Module } from '@nestjs/common';

import { LoggerModule } from '~/infrastructure/logging/logger.module';
import { FileProcessingPublisher } from '~/infrastructure/messaging/file-processing/file-processing.publisher';
import { RabbitmqService } from '~/infrastructure/messaging/rabbitmq.service';

@Module({
    imports: [LoggerModule],
    providers: [RabbitmqService, FileProcessingPublisher],
    exports: [RabbitmqService, FileProcessingPublisher],
})
export class RabbitmqModule {}
