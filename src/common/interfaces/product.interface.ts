import { Topping } from "./topping.interface";

export interface Product {
    id: string;
    name: string;
    topping_list: Topping[];
    price: number;
    order_count: number;
    note: string;
}
