import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class VoucherQueueService {
  private readonly logger = new Logger(VoucherQueueService.name);
  constructor(
    @Inject('voucher-queue-module') private readonly client: ClientProxy,
  ) { }

  public async calculateDiscountVoucher(
    order_price: number,
    shipping_fee: number,
    promotion_code: string,
    customer_id: string,
    merchant_id: string
  ) {
    this.logger.log('[VoucherQueueService.calculateDiscountVoucher]');
    const result = await this.send('laco.voucher.calculate_discount_voucher', {
      order_price,
      shipping_fee,
      promotion_code,
      customer_id,
      merchant_id
    });
    this.logger.log(`[VoucherQueueService.calculateDiscountVoucher] result=${result}`);
    return result;
  }

  public async send(pattern: string, data: any) {
    const result = this.client.send(pattern, data);
    const response = await lastValueFrom(result);
    return response;
  }

  public emit(pattern: string, data: any) {
    this.client.emit(pattern, data);
  }
}
