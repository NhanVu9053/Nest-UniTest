import { IsNotEmpty } from "class-validator"

export class UpdateOrderStatusDTO {
    @IsNotEmpty({ message: 'Thiếu thông tin người gửi' })
    sender: string;
    @IsNotEmpty({ message: 'Thiếu thông tin đơn hàng' })
    order_id: string;
    @IsNotEmpty({ message: 'Thiếu thông tin trạng thái đơn hàng' })
    status: string;
}
