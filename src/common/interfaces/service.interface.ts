import { Position } from "./position.interface"
import { Product } from "./product.interface"

export interface Service {
  type: string,
  distance: Distance
  locations?: Location[],
  // pickup_location?: Location,
  // destination_location?: Location,
  product_list?: Product[],
  metadata?: {
    promotion_code?: string,
    image_url?: string,
  }
}

export interface Distance {
  value: number
  unit: string
}

export interface Location {
  address: string
  position: Position
}