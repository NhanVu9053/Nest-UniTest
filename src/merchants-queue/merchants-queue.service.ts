import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, lastValueFrom, throwError } from 'rxjs';

@Injectable()
export class MerchantsQueueService {
  constructor(
    @Inject('merchants-queue-module') private readonly client: ClientProxy,
  ) {}

  public async getLocationDetail(id: string) {
    const result = await this.send("laco.merchants.get_location_detail", id);
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
