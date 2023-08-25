import { Position } from "./position.interface"

export interface Partner {
  id: string
  type: string
  name: string
  phone_number: string
  metadata?: {
    address?: string
    vehicle_type?: string
    vehicle_registration_number?: string
    position?: Position
    is_verified?: boolean
    open_time?: string
    close_time?: string
  }
}