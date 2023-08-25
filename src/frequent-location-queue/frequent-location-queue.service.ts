import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, lastValueFrom, throwError } from 'rxjs';

@Injectable()
export class FrequentLocationQueueService {
    private readonly logger = new Logger(FrequentLocationQueueService.name);
    constructor(
        @Inject('frequent_locations_queue') private readonly client: ClientProxy,
      ) {}
    
      public async createFrequentLocation(name,
        address,
        position,
        customer_id,
        ) {
        const result = await this.send("laco.frequent_location.create", {name, address, position, customer_id});
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
