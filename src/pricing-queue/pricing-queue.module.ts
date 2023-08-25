import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { PricingQueueService } from './pricing-queue.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '../.env'],
    }),
    ClientsModule.register([
      {
        name: 'pricing-queue-module',
        transport: Transport.RMQ,
        options: {
          urls: process.env.RABBITMQ_URLS.split(' '),
          queue: process.env.LACO_PRICING_QUEUE,
          queueOptions: {
            durable: false
          }
        },
      },
    ]),
  ],
  controllers: [],
  providers: [PricingQueueService],
  exports: [PricingQueueService],
})
export class PricingQueueModule { }
