import { OrdersController } from './orders.controller';
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order';
import { MechantsQueueModule } from 'src/merchants-queue/merchants-queue.module';
import { PricingQueueModule } from 'src/pricing-queue/pricing-queue.module';
import { ShippingQueueModule } from 'src/shipping-queue/shipping-queue.module';
import { DriversOrchestrationQueueModule } from 'src/drivers-orchestration-queue/drivers-orchestration-queue.module';
import { VoucherQueueModule } from '../voucher-queue/voucher-queue.module';
import { BikesService } from './bikes.service';
import { FrequentLocationQueueModule } from 'src/frequent-location-queue/frequent-location-queue.module';
import { DeliveryService } from './delivery.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: Order.name,
                schema: OrderSchema
            }
        ]),
        MechantsQueueModule,
        PricingQueueModule,
        ShippingQueueModule,
        DriversOrchestrationQueueModule,
        VoucherQueueModule,
        FrequentLocationQueueModule
    ],
    controllers: [OrdersController,],
    providers: [OrdersService, BikesService, DeliveryService],
})
export class OrdersModule { }
