import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { MerchantsQueueService } from './merchants-queue.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '../.env'],
    }),
    ClientsModule.register([
      {
        name: 'merchants-queue-module',
        transport: Transport.RMQ,
        options: {
          urls: process.env.RABBITMQ_URLS.split(' '),
          queue: process.env.LACO_MERCHANTS_QUEUE,
          queueOptions: {
            durable: false
          }
        },
      },
    ]),
  ],
  controllers: [],
  providers: [MerchantsQueueService],
  exports: [MerchantsQueueService],
})
export class MechantsQueueModule {}
