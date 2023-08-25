import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from './schemas/order';
import { DriversOrchestrationQueueService } from '../drivers-orchestration-queue/drivers-orchestration-queue.service';
import { RpcException } from '@nestjs/microservices';
import { IOrder } from '../common/interfaces/order-item.interface';
import { BikesService } from './bikes.service';
import { DeliveryService } from './delivery.service';
import { getCurrentDateTime } from '../utils/time';
import { OrderDTO } from './dto/order.dto';
import { Partner } from '../common/interfaces/partner.interface';
import { Position } from '../common/interfaces/position.interface';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private driversOrchestrationQueue: DriversOrchestrationQueueService,
    private bikesService: BikesService,
    private deliveryService: DeliveryService,
  ) { }

  async findOne(id: string): Promise<Order> {
    return this.orderModel.findById(id).exec();
  }

  async findAllByCustomerId(customer_id: string): Promise<Order[]> {
    return this.orderModel.find({ customer_id }).exec();
  }

  async getOrdersByIdsList(order_ids: string[]): Promise<Order[]> {
    return this.orderModel.find({ _id: { $in: order_ids } }).exec();
  }

  async create(submittedOrder: OrderDTO): Promise<IOrder> {
    this.logger.log('[OrdersService.create]');
    this.logger.log('Submitted Order', submittedOrder);
    let createdOrder: OrderDocument;
    switch (submittedOrder.service_type) {
      case 'delivery':
        createdOrder = await this.deliveryService.createOrder(submittedOrder);
        break;
      case 'bike':
        createdOrder = await this.bikesService.createOrder(submittedOrder);
        break;
      default:
        throw Error('No supported this service type');
    }
    return createdOrder;

    // TODO message: "Đơn giá món đã thay đổi trong quá trình bạn đặt món."
    // TODO message: "Quán đã hết phục vụ một trong số những món bạn chọn."
    // TODO message: "Mã khuyến mãi không còn giá trị."
    // TODO message: "Phí vận chuyển vừa được thay đổi."
  }

  async update(order_id: string, submittedOrder: OrderDTO): Promise<IOrder> {
    const filter = { _id: order_id };
    // Tìm kiếm đơn hàng theo order_id
    const foundOrder = await this.orderModel.findOne(filter);

    if (!foundOrder) {
      throw new Error('Order not found');
    }
    switch (foundOrder.service.type) {
      case 'delivery':
        const order = await this.deliveryService.updateDeliveryOrder(order_id, submittedOrder);
        return order;

      case 'bike':
        const bike = await this.bikesService.updateOrder(order_id, submittedOrder);
        return bike;
    }
  }


  async confirm(order_id: string, submittedOrder: OrderDTO) {
    // Một số trường hợp ngoại lệ:
    // 1- Đơn đã được khách hàng confirm rồi. Không cần confirm nữa.
    // 1- Mã khuyến mãi hết giá trị
    // 2- Giá món vừa được cập nhật/Giá cước ship vừa cập nhật
    // 3- Món không còn phục vụ
    // ==> Trả về thông điệp lỗi cho client
    const existedOrder: any = await this.orderModel
      .findOne({ _id: order_id })
      .exec();

    if (existedOrder.status === 'ORDER_CUSTOMER_CONFIRMED') {
      return {
        status: 'failed',
        message: 'This order is just confirmed and waiting for fulfiling.',
        data: existedOrder,
      };
    }

    // Get from PricingService
    // const product_list = submittedOrder.product_list;
    // const shipping_data = await this.getShippingDetail(submittedOrder);
    // const pricing = await this.getPricing(product_list, shipping_data,submittedOrder.promotion_code,submittedOrder.customer_id,submittedOrder.merchant_id);

    const time = getCurrentDateTime();

    existedOrder.customer_confirmed_datetime = time;
    existedOrder.status = 'ORDER_CUSTOMER_CONFIRMED';
    await existedOrder.save();

    const sendData = {
      timestamp: time,
      metadata: existedOrder,
    };
    this.logger.log(
      `[OrdersService.confirm] emit "laco.drivers.customer-confirmed-order" sendData=${JSON.stringify(
        sendData,
      )}`,
    );
    this.driversOrchestrationQueue.emit(
      'laco.drivers.customer-confirmed-order',
      sendData,
    );
    return {
      status: 'success',
      data: existedOrder,
    };
  }

  async updateOrderStatus(order_id: string, status: string): Promise<Order> {
    const order = await this.orderModel.findById({ _id: order_id }).exec();
    if (!order) {
      // this.logger.debug(`[OrderService.confirmShipping] Order with ID ${order_id} not found`);
      throw new RpcException(`Order with ID ${order_id} not found`);
    }

    // if (order.shipping.shipper_confirmed_datetime) {
    // this.logger.debug(`[OrderService.confirmShipping] Order with ID ${order_id} has already been confirmed by a shipper`);
    // throw new BadRequestException(`Order with ID ${order_id} has already been confirmed by a shipper`);
    // }

    // order.shipping.shipper_id = shipperId;
    // order.shipping.shipper_confirmed_datetime = new Date().toISOString();

    order.status = status;
    return order.save();
  }

  // async cancelShipping(order_id: string, shipperId: string): Promise<Order> {
  //   const order = await this.orderModel.findById(order_id).exec();
  //   if (!order) {
  //     this.logger.debug(`[OrderService.cancelShipping] Order with ID ${order_id} not found`);
  //     throw new NotFoundException(`Order with ID ${order_id} not found`);
  //   }

  //   if (order.shipping.shipper_confirmed_datetime) {
  //     this.logger.debug(`[OrderService.cancelShipping] Order with ID ${order_id} has already been confirmed by a shipper`);
  //     throw new BadRequestException(`Order with ID ${order_id} has already been confirmed by a shipper`);
  //   }

  //   order.shipping.shipper_cancelled_logs.push({
  //     shipper_id: shipperId,
  //     cancelled_datetime: new Date().toISOString()
  //   });

  //   return order.save();
  // }

  async getOrdersByCustomerIdAndServiceType(customer_id: string, service_type: string): Promise<IOrder[]> {
    const filter = (service_type) ? { ["service.type"]: service_type, ["customer.id"]: customer_id } : { ["customer.id"]: customer_id };
    return await this.orderModel.find(filter).exec();
  }

  async addDriverPartner(order_id: string, driver_id: string, position: Position): Promise<Order> {
    const order = await this.orderModel.findById({ _id: order_id }).exec();
    if (!order) {
      throw new RpcException(`Order with ID ${order_id} not found`);
    }

    let partner_type = '';
    switch (order.service.type) {
      case 'delivery':
        partner_type = 'shipper';
        break;
      case 'bike':
        partner_type = 'driver';
        break;
      case 'car':
        partner_type = 'driver';
      default:
        partner_type = 'driver';
    }

    const partner: Partner = {
      id: driver_id, name: '', type: partner_type, phone_number: '', metadata: {
        vehicle_type: '',
        vehicle_registration_number: '',
        position
      }
    }

    order.partners.push(partner);
    await order.save();
    return order;
  }
}
