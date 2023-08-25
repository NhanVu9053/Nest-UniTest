import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from './schemas/order';
import { PricingQueueService } from '../pricing-queue/pricing-queue.service';
import { IOrder } from '../common/interfaces/order-item.interface';
import { Invoice } from '../common/interfaces/invoice.interface';
import { Partner } from '../common/interfaces/partner.interface';
import { Service } from '../common/interfaces/service.interface';
import { Customer } from '../common/interfaces/customer.interface';
import { OrderDTO } from './dto/order.dto';
import { RpcException } from '@nestjs/microservices';
import { MerchantsQueueService } from '../merchants-queue/merchants-queue.service';
import { VoucherQueueService } from '../voucher-queue/voucher-queue.service';
import { Product } from '../common/interfaces/product.interface';
import { Topping } from '../common/interfaces/topping.interface';
import { getCurrentDateTime } from '../utils/time';

@Injectable()
export class DeliveryService {
    private readonly logger = new Logger(DeliveryService.name);
    constructor(
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        private merchantsQueue: MerchantsQueueService,
        private pricingQueue: PricingQueueService,
        private voucherQueueService: VoucherQueueService,
    ) { }

    async createOrder(
        submittedOrder: OrderDTO,
    ): Promise<OrderDocument> {
        const created_at_time = getCurrentDateTime();
        const product_list = submittedOrder.product_list;
        const shipping_data = await this.getShippingDetail(submittedOrder);
        const pricing = await this.getPricing(
            product_list,
            shipping_data,
            submittedOrder.promotion_code,
            submittedOrder.customer_id,
            submittedOrder.merchant_id,
        );

        const invoice: Invoice = this.buildInvoice(pricing.first_price, pricing.shipping_fee, pricing.promotion_price, pricing.total_price);

        const partners: Partner[] = [
            {
                id: shipping_data.merchant.id,
                type: 'merchant',
                name: shipping_data.merchant.name,
                phone_number: shipping_data.merchant.phone_number,
                metadata: {
                    address: shipping_data.merchant.address,
                    is_verified: shipping_data.merchant.is_verified_position,
                    open_time: shipping_data.merchant.open_time,
                    close_time: shipping_data.merchant.close_time,
                },
            },
        ];

        const service: Service = {
            type: submittedOrder.service_type,
            distance: {
                value: pricing.shipping_distance,
                unit: 'km',
            },
            product_list: submittedOrder.product_list,
            locations: [
                {
                    address: shipping_data.merchant.address,
                    position: shipping_data.merchant_location,
                },
                {
                    address: submittedOrder.delivery_address,
                    position: shipping_data.customer_location,
                },
            ],
            metadata: {
                image_url: shipping_data.image_url,
            },
        };

        const customer: Customer = {
            id: submittedOrder.customer_id,
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
        return createdOrder;
    }

    private async getShippingDetail(submittedOrder: OrderDTO) {
        const merchantDetail = await this.merchantsQueue.getLocationDetail(
            submittedOrder.merchant_id,
        );
        this.logger.log(
            `[OrdersService.getShippingDetail] Got detail data of merchant_id=${submittedOrder.merchant_id}`,
        );

        if (merchantDetail.status === 'error') {
            throw new RpcException('There is no information about this merchant');
        }

        if (merchantDetail.data?.position === null) {
            throw new RpcException('Merchant does not have geo location');
        }

        const customer_location = submittedOrder.delivery_position;
        const merchant_location = {
            lat: merchantDetail.data.position.lat,
            lng: merchantDetail.data.position.lng,
        };

        const {
            id,
            name,
            address,
            phone_number,
            position,
            is_verified_position,
            open_time,
            close_time,
            images,
        } = merchantDetail.data;

        const merchant = {
            id,
            name,
            address,
            phone_number,
            position,
            is_verified_position,
            open_time,
            close_time,
        };

        const image_url = images.length > 0 ? images[0] : '';

        this.logger.log(
            `[OrdersService.getShippingDetail] customer_location=${customer_location}; merchant_location=${merchant_location}`,
        );
        const shipping_data = {
            serviceType: submittedOrder.service_type,
            customer_location,
            merchant_location,
            merchant,
            image_url,
        };
        return shipping_data;
    }

    private async getPricing(
        product_list,
        shipping_data,
        promotion_code,
        customer_id,
        merchant_id,
    ) {
        const first_price = this.calculatePriceFromProductList(product_list);

        // Get from PricingService
        const {
            serviceType,
            customer_location: start_location,
            merchant_location: end_location,
        } = shipping_data;
        const pricingFee = await this.pricingQueue.calculateShippingFee({
            serviceType,
            start_location,
            end_location,
        });
        this.logger.log(
            `[OrdersService.getPricing] pricingFee=${JSON.stringify(pricingFee)}`,
        );
        const discountVoucher =
            await this.voucherQueueService.calculateDiscountVoucher(
                first_price,
                pricingFee.fee,
                promotion_code,
                customer_id,
                merchant_id,
            );
        if (discountVoucher.status == 'success') {
            const promotion_price = discountVoucher.data.discount_amount;
            const total_price = first_price + pricingFee.fee - promotion_price;
            const pricing = {
                first_price, // giá ban đầu
                shipping_fee: pricingFee.fee, // phí ship / phí taxi / xe ôm
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
                first_price, // giá ban đầu
                shipping_fee: pricingFee.fee, // phí ship / phí taxi / xe ôm
                shipping_distance: pricingFee.km, // quãng đường đi
                promotion_price,
                promotion_message:
                    !promotion_code || promotion_code === ''
                        ? ''
                        : discountVoucher.data.promotion_status,
                total_price, // tổng giá
            };
            return pricing;
        }
    }

    sumToppingPrice(toppingList: Topping[]) {
        return toppingList.reduce((prev, topping) => prev + topping.price, 0);
    }

    calculatePriceFromProductList(product_list: Product[]) {
        return product_list.reduce(
            (prev, product) =>
                prev + this.sumToppingPrice(product.topping_list) + product.price,
            0,
        );
    }

    async updateDeliveryOrder(order_id: string, submittedOrder: OrderDTO): Promise<OrderDocument> {

        const filter = { _id: order_id };

        const updated_at_time = getCurrentDateTime();
        const product_list = submittedOrder.product_list;
        const shipping_data = await this.getShippingDetail(submittedOrder);
        const pricing = await this.getPricing(product_list, shipping_data, submittedOrder.promotion_code, submittedOrder.customer_id, submittedOrder.merchant_id);
        const invoice: Invoice = this.buildInvoice(pricing.first_price, pricing.shipping_fee, pricing.promotion_price, pricing.total_price);
        const partners: Partner[] = [
            {
                id: shipping_data.merchant.id,
                type: "merchant",
                name: shipping_data.merchant.name,
                phone_number: shipping_data.merchant.phone_number,
                metadata: {
                    address: shipping_data.merchant.address,
                    is_verified: shipping_data.merchant.is_verified_position,
                    open_time: shipping_data.merchant.open_time,
                    close_time: shipping_data.merchant.close_time,
                }
            }
        ]

        const service: Service = {
            type: submittedOrder.service_type,
            distance: {
                value: pricing.shipping_distance,
                unit: "km"
            },
            product_list: submittedOrder.product_list,
            locations: [
                {
                    address: shipping_data.merchant.address,
                    position: shipping_data.merchant_location
                },
                {
                    address: submittedOrder.delivery_address,
                    position: shipping_data.customer_location
                }
            ],
            metadata: {
                image_url: shipping_data.image_url
            }
        }

        const customer: Customer = {
            id: submittedOrder.customer_id,
            "name": "",
            "phone_number": "",
            "email": "",
            "gender": ""
        }

        const order: IOrder = { partners, invoice, customer, service, updated_at: updated_at_time };
        const foundOrder = await this.orderModel.findOneAndUpdate(filter, order, { returnDocument: 'after' });
        await foundOrder.save();
        return foundOrder;
    }

    private buildInvoice(first_price, shipping_fee, promotion_price, total_price): Invoice {
        return {
            items: [
                {
                    label: 'Tiền tạm tính',
                    sublabel: '',
                    amount: first_price,
                    type: '+',
                    currency: 'đ',
                },
                {
                    label: 'Tiền vận chuyển',
                    sublabel: '',
                    amount: shipping_fee,
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