import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { VoucherQueueService } from './voucher-queue.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '../.env'],
    }),
    ClientsModule.register([
      {
        name: 'voucher-queue-module',
        transport: Transport.RMQ,
        options: {
          urls: process.env.RABBITMQ_URLS.split(' '),
          queue: process.env.LACO_VOUCHER_QUEUE,
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  controllers: [],

  providers: [VoucherQueueService],
  exports: [VoucherQueueService],
})
export class VoucherQueueModule { }
