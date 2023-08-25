import { orderStub } from "../test/stubs/order.stub";

export const OrdersService = jest.fn().mockReturnValue({
  findOne: jest.fn().mockReturnValue(orderStub()),
  createOrder: jest.fn().mockResolvedValue(orderStub()),
  updateOrder: jest.fn().mockResolvedValue(orderStub()),
})