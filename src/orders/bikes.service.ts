import { Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from './schemas/order';
import { PricingQueueService } from '../pricing-queue/pricing-queue.service';
import { IOrder } from '../common/interfaces/order-item.interface';
import { Invoice } from '../common/interfaces/invoice.interface';
import { Partner } from '../common/interfaces/partner.interface';
import { Service } from '../common/interfaces/service.interface';
import { Customer } from '../common/interfaces/customer.interface';
import { FrequentLocationQueueService } from '../frequent-location-queue/frequent-location-queue.service';
import { VoucherQueueService } from '../voucher-queue/voucher-queue.service';
import { getCurrentDateTime } from '../utils/time';
import { OrderDTO } from './dto/order.dto';

@Injectable()
export class BikesService {
  private readonly logger = new Logger(BikesService.name);
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private pricingQueue: PricingQueueService,
    private voucherQueueService: VoucherQueueService,
    private frequentLocationQueue: FrequentLocationQueueService,
  ) { }

  async createOrder(
    submittedBike: OrderDTO,
  ): Promise<OrderDocument> {
    try {
      const created_at_time = getCurrentDateTime();
      const pickup_position = submittedBike.pickup_position;
      const destination_position = submittedBike.destination_position;
      const shipping_data = {
        serviceType: submittedBike.service_type,
        pickup_position,
        destination_position,
      };
      const pricing = await this.getPricing(
        shipping_data,
        submittedBike.promotion_code,
        submittedBike.customer_id,
      );
      const invoice: Invoice = this.buildInvoice(pricing.first_price, pricing.promotion_price, pricing.total_price);

      const partners: Partner[] = []; // Ở bước này chưa có tài xế xác nhận nên sẽ để list rỗng

      const service: Service = {
        type: submittedBike.service_type,
        distance: {
          value: pricing.shipping_distance,
          unit: 'km',
        },
        locations: [
          {
            address: submittedBike.pickup_address,
            position: submittedBike.pickup_position
          },
          {
            address: submittedBike.destination_address,
            position: submittedBike.destination_position
          }
        ],
        metadata: {
          image_url: '',
        },
      };

      const customer: Customer = {
        id: submittedBike.customer_id,
        name: '',
        phone_number: '',
        email: '',
        gender: '',
      };

      const order: IOrder = {
        partners,
        invoice,
        customer,
        service,
        created_at: created_at_time,
        status: 'ORDER_CREATED',
      };
      const createdOrder = await this.orderModel.create(order);
      await createdOrder.save();
      const name = await this.removeAddressPart(
        submittedBike.destination_address,
      );
      await this.frequentLocationQueue.createFrequentLocation(
        name,
        submittedBike.destination_address,
        submittedBike.destination_position,
        submittedBike.customer_id,
      );
      return createdOrder;
    } catch (error: any) {
      this.logger.log(error.message);
    }
  }

  // async getBikePricing(shipping_data, promotion_code, customer_id) {
  //   // Get from PricingService
  //   const {
  //     serviceType,
  //     pickup_position: start_location,
  //     destination_position: end_location,
  //   } = shipping_data;
  //   const pricingFee = await this.pricingQueue.calculateShippingFee({
  //     serviceType,
  //     start_location,
  //     end_location,
  //   });
  //   this.logger.log(
  //     `[OrdersService.getPricing] pricingFee=${JSON.stringify(pricingFee)}`,
  //   );
  //   // const discountVoucher = await this.voucherQueueService.calculateDiscountVoucher(first_price,pricingFee.fee,promotion_code,customer_id,merchant_id);

  //   const promotion_price = 0; // Tạm thời chưa tính giảm giá
  //   const total_price = pricingFee.fee - promotion_price;

  //   const pricing = {
  //     shipping_fee: pricingFee.fee, // phí ship / phí taxi / xe ôm
  //     shipping_distance: pricingFee.km, // quãng đường đi
  //     promotion_price,
  //     // promotion_message: (!promotion_code || promotion_code === "") ? "" : discountVoucher.data.promotion_status,
  //     total_price, // tổng giá
  //   };
  //   return pricing;
  // }

  private async getPricing(shipping_data, promotion_code, customer_id) {

    // Get from PricingService
    const {
      serviceType,
      pickup_position: start_location,
      destination_position: end_location,
    } = shipping_data;
    const pricingFee = await this.pricingQueue.calculateShippingFee({
      serviceType,
      start_location,
      end_location,
    });
    const first_price = 0;
    this.logger.log(
      `[BikesService.getPricing] pricingFee=${JSON.stringify(pricingFee)}`,
    );
    const discountVoucher =
      await this.voucherQueueService.calculateDiscountVoucher(
        pricingFee.fee,
        0,
        promotion_code,
        customer_id,
        "",
      );
    if (discountVoucher.status == 'success') {
      const promotion_price = discountVoucher.data.discount_amount;
      const total_price = first_price + pricingFee.fee - promotion_price;
      const pricing = {
        first_price: pricingFee.fee, // phí taxi / xe ôm
        shipping_fee: 0, // phí ship không áp dụng với taxi / xe ôm
        shipping_distance: pricingFee.km, // quãng đường đi
        promotion_price, // giá khuyến mãi.  ==> Tại bước này chưa có
        promotion_message: discountVoucher.data.promotion_message,
        total_price, // tổng giá
      };
      return pricing;
    } else {
      const promotion_price = 0; // giá khuyến mãi.  ==> Lỗi khuyến mãi nên giá trị = 0
      const total_price = first_price + pricingFee.fee;

      const pricing = {
        first_price: pricingFee.fee, // phí taxi / xe ôm
        shipping_fee: 0, // phí ship không áp dụng với taxi / xe ôm
        shipping_distance: pricingFee.km, // quãng đường đi
        promotion_price,
        promotion_message:
          !promotion_code || promotion_code === '' ? '' : discountVoucher.data.promotion_status,
        total_price, // tổng giá
      };
      return pricing;
    }
  }

  // async update(order_id: string, updateBikeDto: UpdateOrderDTO) {
  //   const filter = { _id: order_id };
  //   const update = updateBikeDto;
  //   const shipping_data = {
  //     serviceType: updateBikeDto.service_type,
  //     pickup_position: updateBikeDto.pickup_position,
  //     destination_position: updateBikeDto.destination_position,
  //   };
  //   const pricing = await this.getBikePricing(
  //     shipping_data,
  //     updateBikeDto.promotion_code,
  //     updateBikeDto.customer_id,
  //   );
  //   const foundOrder = await this.orderModel.findOneAndUpdate(filter, update);
  //   await foundOrder.save();
  //   const order = { order_id, ...updateBikeDto, pricing };
  //   return order;
  // }

  async updateOrder(order_id: string, submittedOrder: OrderDTO): Promise<OrderDocument> {

    const filter = { _id: order_id };

    const updated_at_time = getCurrentDateTime();
    const route_data = {
      serviceType: submittedOrder.service_type,
      pickup_position: submittedOrder.pickup_position,
      destination_position: submittedOrder.destination_position,
    };
    const pricing = await this.getPricing(route_data, submittedOrder.promotion_code, submittedOrder.customer_id);

    const invoice: Invoice = this.buildInvoice(pricing.first_price, pricing.promotion_price, pricing.total_price);

    const partners: Partner[] = []

    const service: Service = {
      type: submittedOrder.service_type,
      distance: {
        value: pricing.shipping_distance,
        unit: "km"
      },
      product_list: submittedOrder.product_list,
      locations: [
        {
          address: submittedOrder.pickup_address,
          position: submittedOrder.pickup_position
        },
        {
          address: submittedOrder.destination_address,
          position: submittedOrder.destination_position
        }
      ],
      metadata: {}
    }

    const customer: Customer = {
      id: submittedOrder.customer_id,
      "name": "",
      "phone_number": "",
      "email": "",
      "gender": ""
    }

    const order: IOrder = { partners, invoice, customer, service, updated_at: updated_at_time };
    const foundOrder = await this.orderModel.findOneAndUpdate(filter, order,{ returnDocument: 'after' });
    await foundOrder.save();
    return foundOrder;
  }

  async removeAddressPart(address) {
    const targetString = '550000, Việt Nam';
    const index = address.indexOf(targetString);

    if (index !== -1) {
      address = address.slice(0, index).trim() + address.slice(index + targetString.length).trim();
      address = address.trim();
    }
    return address;
  }

  private buildInvoice(first_price, promotion_price, total_price): Invoice {
    return {
      items: [
        {
          label: 'Tiền cước',
          sublabel: '',
          amount: first_price,
          type: '+',
          currency: 'đ',
        },
        {
          label: 'Tiền khuyến mãi',
          sublabel: '',
          amount: promotion_price,
          type: '-',
          currency: 'đ',
        },
      ],
      total: {
        label: 'Tổng cộng',
        sublabel: 'Tổng cộng',
        amount: total_price,
        type: '=',
        currency: 'đ',
      },
    };
  }
}
