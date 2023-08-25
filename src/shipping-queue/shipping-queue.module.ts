import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { ShippingQueueService } from './shipping-queue.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '../.env'],
    }),
    ClientsModule.register([
      {
        name: 'shipping-queue-module',
        transport: Transport.RMQ,
        options: {
          urls: process.env.RABBITMQ_URLS.split(' '),
          queue: process.env.LACO_SHIPPING_QUEUE,
          queueOptions: {
            durable: true
          }
        },
      },
    ]),
  ],
  controllers: [],
  providers: [ShippingQueueService],
  exports: [ShippingQueueService],
})
export class ShippingQueueModule { }
