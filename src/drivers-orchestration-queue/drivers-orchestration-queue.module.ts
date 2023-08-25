import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { DriversOrchestrationQueueService } from './drivers-orchestration-queue.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '../.env'],
    }),
    ClientsModule.register([
      {
        name: 'drivers-orchestration-queue',
        transport: Transport.RMQ,
        options: {
          urls: process.env.RABBITMQ_URLS.split(' '),
          queue: process.env.LACO_DRIVERS_QUEUE,
          queueOptions: {
            durable: true
          }
        },
      },
    ]),
  ],
  controllers: [],
  providers: [DriversOrchestrationQueueService],
  exports: [DriversOrchestrationQueueService],
})
export class DriversOrchestrationQueueModule {}
