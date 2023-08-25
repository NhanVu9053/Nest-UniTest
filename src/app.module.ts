import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { OrdersModule } from './orders/orders.module';
import { MongooseModule } from '@nestjs/mongoose';
import { WinstonModule } from 'nest-winston';
import { LoggerConfig } from './logger-config';
import { FrequentLocationQueueModule } from './frequent-location-queue/frequent-location-queue.module';
const logger: LoggerConfig = LoggerConfig.getInstance();    

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '../.env'],
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }),
    OrdersModule,
    WinstonModule.forRoot(logger.console()),
    FrequentLocationQueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
