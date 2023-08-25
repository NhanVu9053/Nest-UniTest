import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, lastValueFrom, throwError } from 'rxjs';

@Injectable()
export class PricingQueueService {
  private readonly logger = new Logger(PricingQueueService.name);
  constructor(
    @Inject('pricing-queue-module') private readonly client: ClientProxy,
  ) { }

  public async calculateShippingFee({
    serviceType,
    start_location,
    end_location }
  ) {
    this.logger.log(`[PricingQueueService.calculateShippingFee] send "laco.pricing.calculate_shipping_fee"`)
    const result = await this.send("laco.pricing.calculate_shipping_fee", {
      serviceType,
      start_location,
      end_location
    });
    return result;
  }

  private async send(pattern: string, data: any) {
    const result = this.client
      .send(pattern, data)
      .pipe(catchError(error => throwError(() => new RpcException(error.message))));
    const response = await lastValueFrom(result);
    return response;
  }
  private emit(pattern: string, data: any) {
    this.client.emit(pattern, data);
  }
}
