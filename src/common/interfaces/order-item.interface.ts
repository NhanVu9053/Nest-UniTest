import { Customer } from "./customer.interface"
import { Invoice } from "./invoice.interface"
import { Partner } from "./partner.interface"
import { Service } from "./service.interface"

export interface IOrder {
  _id?: string
  partners: Partner[] | any
  invoice: Invoice | any
  customer: Customer | any
  service: Service | any
  status?: string
  created_at?: string,
  updated_at?: string
}