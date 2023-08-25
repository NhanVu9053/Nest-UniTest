import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import logger from './logger';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: process.env.RABBITMQ_URLS.split(' '),
      queue: process.env.LACO_ORDERS_QUEUE,
      queueOptions: {
        durable: true
      },
    },
    logger
  });
  await app.listen();
}
bootstrap();
