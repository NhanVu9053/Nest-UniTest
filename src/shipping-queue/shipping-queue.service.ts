import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, lastValueFrom, throwError } from 'rxjs';

@Injectable()
export class ShippingQueueService {
  constructor(
    @Inject('shipping-queue-module') private readonly client: ClientProxy,
  ) { }

  public async send(pattern: string, data: any) {
    const result = this.client
      .send(pattern, data)
      .pipe(catchError(error => throwError(() => new RpcException(error.message))));
    const response = await lastValueFrom(result);
    return response;
  }
  public emit(pattern: string, data: any) {
    this.client.emit(pattern, data);
  }
}
