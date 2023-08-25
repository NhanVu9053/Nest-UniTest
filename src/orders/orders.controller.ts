import { Controller, Logger } from '@nestjs/common';
import { OrderDTO } from './dto/order.dto';
import { OrdersService } from './orders.service';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { IOrder } from 'src/common/interfaces/order-item.interface';
import { Position } from 'src/common/interfaces/position.interface';

@Controller()
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);
  constructor(private readonly orderService: OrdersService) { }

  @MessagePattern('laco.orders.get-orders-by-customer-id')
  async getOrderByCustomersId(
    @Payload() customer_id: string,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`Pattern: ${context.getPattern()}`);
    this.logger.log(
      `[OrdersController.getOrderById] [MessagePattern] laco.orders.get-order-by-id customer_id=${customer_id}`,
    );
    return await this.orderService.findAllByCustomerId(customer_id);
  }

  @MessagePattern("laco.orders.get-order-by-id")
  async getOrderById(@Payload() order_id: string, @Ctx() context: RmqContext) {
    // this.logger.log(`Pattern: ${context.getPattern()}`);
    // this.logger.log(`[OrdersController.getOrderById] [MessagePattern] laco.orders.get-order-by-id order_id=${order_id}`);
    return await this.orderService.findOne(order_id);
  }

  @MessagePattern('laco.orders.get-orders-by-ids-list')
  async getOrdersByIdsList(@Payload() order_ids: string[], @Ctx() context: RmqContext) {
    this.logger.log(`Pattern: ${context.getPattern()}`);
    this.logger.log(`[OrdersController.getOrdersByIdsList] order_ids=${order_ids}`,);
    return await this.orderService.getOrdersByIdsList(order_ids);
  }

  @MessagePattern('laco.order.create_request')
  async create(@Payload() order: OrderDTO, @Ctx() context: RmqContext) {
    this.logger.log(`Pattern: ${context.getPattern()}`);
    this.logger.log('[OrdersController.create] [MessagePattern] laco.order.create_request');
    const createdOrder: IOrder = await this.orderService.create(order);
    return this.formatOrderResponse(createdOrder);
  }

  @MessagePattern('laco.order.confirm_request')
  async confirm(
    @Payload() data: { id: string; confirmedOrder: OrderDTO },
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`Pattern: ${context.getPattern()}`);
    this.logger.log(
      `[OrdersController.confirm] [MessagePattern] laco.order.confirm_request order_id=${data.id}`,
    );
    // this.logger.log("[MessagePattern] laco.order.confirm_request", data);
    const savedOrder = await this.orderService.confirm(data.id, data.confirmedOrder);
    savedOrder.data = this.formatOrderResponse(savedOrder.data);
    return savedOrder;
  }

  @MessagePattern('laco.order.update_request')
  async update(
    @Payload() data: { id: string; updatedOrder: OrderDTO },
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`Pattern: ${context.getPattern()}`);
    this.logger.log(`[OrdersController.update] [MessagePattern] laco.order.update_request order_id=${data.id}`);
    const updatedOrder: IOrder = await this.orderService.update(data.id, data.updatedOrder);
    return this.formatOrderResponse(updatedOrder);
  }

  @MessagePattern('laco.order.update-order-status')
  async updateStatus(
    @Payload() data: { order_id: string; status: string },
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`Pattern: ${context.getPattern()}`);
    const { order_id, status } = data;
    this.logger.log(
      `[OrdersController.updateStatus] [MessagePattern] update-order-status order_id=${order_id}, status=${status}`,
    );
    return await this.orderService.updateOrderStatus(order_id, status);
  }

  @MessagePattern("laco.orders.get-history")
  async getOrdersHistory(@Payload() payload: { customer_id: string, service_type: string }, @Ctx() context: RmqContext) {
    const { customer_id, service_type } = payload;
    this.logger.log(`Pattern: ${context.getPattern()}`);
    return await this.orderService.getOrdersByCustomerIdAndServiceType(customer_id, service_type);
  }

  private formatOrderResponse(order: IOrder) {
    const LACO_CONFIRM_DURATION = 60; // seconds
    const { _id, partners, invoice, customer, service, created_at } = order;
    switch (order.service.type) {
      case 'delivery':
        const pricing = {
          first_price: order.invoice.items[0].amount, // giá ban đầu
          shipping_fee: order.invoice.items[1].amount, // phí ship / phí taxi / xe ôm
          shipping_distance: order.service.distance.value, // quãng đường đi
          promotion_price: order.invoice.items[2].amount,
          promotion_message: '',
          total_price: order.invoice.total.amount // tổng giá
        };
        return {
          order_id: _id,
          service_type: service.type,
          merchant: partners.filter(
            (partner) => partner.type === 'merchant',
          )[0],
          product_list: service.product_list,
          pricing,
          promotion_code: service.metadata.promotion_code,
          image_url: order.service.metadata.image_url,
          timeout: LACO_CONFIRM_DURATION,
          partners,
          invoice,
          customer,
          service,
          created_at
        };
      case 'bike':
        return {
          order_id: _id,
          timeout: LACO_CONFIRM_DURATION,
          partners,
          invoice,
          customer,
          service,
          created_at
        };
      default:
        return order;
    }
  }

  @MessagePattern("laco.orders.add-driver-partner")
  async addDriverPartner(@Payload() payload: { order_id: string, driver_id: string, position: Position }, @Ctx() context: RmqContext) {
    const { order_id, driver_id, position } = payload;
    this.logger.log(`Pattern: ${context.getPattern()}`);
    return await this.orderService.addDriverPartner(order_id, driver_id, position);
  }
}
