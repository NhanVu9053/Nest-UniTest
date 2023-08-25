import { RmqContext } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { PricingQueueService } from '../../pricing-queue/pricing-queue.service';
import { DriversOrchestrationQueueService } from '../../drivers-orchestration-queue/drivers-orchestration-queue.service';
import { BikesService } from '../bikes.service';
import { DeliveryService } from '../delivery.service';
import { OrdersController } from '../orders.controller';
import { OrdersService } from '../orders.service';
import { OrderModel } from '../../orders/test/support/order.model';
import { orderStub } from './stubs/order.stub';
import { MechantsQueueModule } from '../../merchants-queue/merchants-queue.module';
import { PricingQueueModule } from '../../pricing-queue/pricing-queue.module';
import { ShippingQueueModule } from '../../shipping-queue/shipping-queue.module';
import { DriversOrchestrationQueueModule } from '../../drivers-orchestration-queue/drivers-orchestration-queue.module';
import { VoucherQueueModule } from '../../voucher-queue/voucher-queue.module';
import { FrequentLocationQueueModule } from '../../frequent-location-queue/frequent-location-queue.module';
import { Order } from '../schemas/order';
import { getModelToken } from '@nestjs/mongoose';
import { MerchantsQueueService } from '../../merchants-queue/merchants-queue.service';
import { VoucherQueueService } from '../../voucher-queue/voucher-queue.service';
import { FrequentLocationQueueService } from '../../frequent-location-queue/frequent-location-queue.service';
import { ShippingQueueService } from '../../shipping-queue/shipping-queue.service';
import { Logger } from '@nestjs/common';
import { expect } from 'chai';

jest.mock('../orders.service');

describe('OrdersController', () => {
  let ordersController: OrdersController;
  let ordersService: OrdersService;
  let bikesService: BikesService;
  let pricingQueueService: PricingQueueService;
  let logger: Logger; 
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
      ],
      controllers: [OrdersController],
      providers: [
        OrdersService,
        BikesService,
        DeliveryService,
        PricingQueueService,
        VoucherQueueService,
        FrequentLocationQueueService,
        {
          provide: DriversOrchestrationQueueService,
          useValue: {
            send: jest.fn(),
            emit: jest.fn(),
          },
        },
        {
          provide: ShippingQueueService,
          useValue: {
            send: jest.fn(),
            emit: jest.fn(),
          },
        },
        {
          provide: MerchantsQueueService,
          useValue: {
            send: jest.fn(),
            emit: jest.fn(),
          },
        },
        {
          provide: PricingQueueService,
          useValue: {
            send: jest.fn(),
            emit: jest.fn(),
          },
        },
        {
          provide: VoucherQueueService,
          useValue: {
            send: jest.fn(),
            emit: jest.fn(),
          },
        },
        {
          provide: FrequentLocationQueueService,
          useValue: {
            send: jest.fn(),
            emit: jest.fn(),
          },
        },
        {
          provide: getModelToken('Order'), // Replace with your model name
          useValue: {}, // Provide a mock object if necessary
        },
        Logger
      ],
    }).compile();

    ordersController = moduleRef.get<OrdersController>(OrdersController);
    ordersService = moduleRef.get<OrdersService>(OrdersService);
    bikesService = moduleRef.get<BikesService>(BikesService);
    pricingQueueService = moduleRef.get<PricingQueueService>(PricingQueueService);
    logger = moduleRef.get<Logger>(Logger);
  });

    describe('when getOrder is called', () => {
      let order: Order;
      const order_id = 'Customer_ID_Test'; // Đảm bảo giá trị của order_id là chuỗi
      const args = [{ test: true }, 'test', 'pattern'];
      let context: RmqContext;
      
      test('then it should call ordersService', () => {
        expect(ordersService.findOne).toBeCalledWith(order_id);
      });

      test('then it should return an order', () => {
        expect(order).to.deep.equal(orderStub());
      });
      
    });

});