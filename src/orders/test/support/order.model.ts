import { MockModel } from "src/database/test/support/mock.model";
import { Order } from "src/orders/schemas/order";
import { orderStub } from "../stubs/order.stub";


export class OrderModel extends MockModel<Order> {
  protected entityStub = orderStub()
}