import { Position } from "./position.interface";

export interface OrderStatus {
    sender: string;
    order_id: string;
    status: string;
    position?: Position;
}