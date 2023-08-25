import { Position } from "src/common/interfaces/position.interface";
import { Product } from "src/common/interfaces/product.interface";

export class OrderDTO {
    customer_id: string;
    service_type: string;
    delivery_address?: string;
    delivery_position?: Position;
    merchant_id?: string;
    product_list?: Product[];
    promotion_code?: string;
    pickup_address?: string;
    pickup_position?: Position;
    destination_address?: string;
    destination_position?: Position;
}
