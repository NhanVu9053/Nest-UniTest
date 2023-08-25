import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IOrder } from 'src/common/interfaces/order-item.interface';

export type OrderDocument = Order & Document;

@Schema()
export class Order implements IOrder {

  @Prop(raw([
    {
      id: { type: String },
      type: { type: String },
      name: { type: String },
      phone_number: { type: String },
      metadata: {
        address: { type: String },
        position: { type: JSON },
        vehicle_type: { type: String },
        vehicle_registration_number: { type: String },
        is_verified_position: { type: Boolean },
        open_time: { type: String },
        close_time: { type: String }
      }
    }
  ]))
  partners: Record<string, any>[];

  @Prop(raw({
    items: { type: JSON },
    total: { type: JSON },
  }))
  invoice: Record<string, any>;

  @Prop(raw({
    id: { type: String },
    name: { type: String },
    phone_number: { type: String },
    email: { type: String },
    gender: { type: String }
  }))
  customer: Record<string, any>;

  @Prop({ type: JSON })
  service: Record<string, any>;

  @Prop({ required: true })
  status: string;

  @Prop()
  created_at: string;

  @Prop()
  updated_at: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);