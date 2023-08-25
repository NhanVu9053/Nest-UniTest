import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FrequentLocationQueueService } from './frequent-location-queue.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '../.env'],
    }),
    ClientsModule.register([
      {
        name: 'frequent_locations_queue',
        transport: Transport.RMQ,
        options: {
          urls: process.env.RABBITMQ_URLS.split(' '),
          queue: process.env.LACO_FREQUENT_LOCATION_QUEUE,
          queueOptions: {
            durable: true,
          }
        },
      },
    ]),
  ],
  controllers: [],
  providers: [FrequentLocationQueueService],
  exports:[FrequentLocationQueueService],
})
export class FrequentLocationQueueModule {}
