import { Order } from 'src/orders/schemas/order';

export const orderStub = (): Order => {
  return {
    invoice: {
      items: [
        {
          label: 'Tiền tạm tính',
          sublabel: '',
          amount: 155000,
          type: '+',
          currency: 'đ',
        },
        {
          label: 'Tiền vận chuyển',
          sublabel: '',
          amount: 38550,
          type: '-',
          currency: 'đ',
        },
        {
          label: 'Tiền khuyến mãi',
          sublabel: '',
          amount: 0,
          type: '-',
          currency: 'đ',
        },
      ],
      total: {
        label: 'Tổng cộng',
        sublabel: 'Tổng cộng',
        amount: 193550,
        type: '=',
        currency: 'đ',
      },
    },
    customer: {
      id: 'Customer_ID_Test',
      name: '',
      phone_number: '',
      email: '',
      gender: '',
    },
    partners: [
      {
        metadata: {
          address: '8 Hoàng Văn Thụ',
          open_time: '09:00',
          close_time: '21:30',
        },
        id: '6',
        type: 'merchant',
        name: "Pizza 4P's",
        phone_number: '1900 6043',
        _id: '64d0b6ad6ddf4f33459bf165',
      },
    ],
    service: {
      type: 'delivery',
      distance: {
        value: 6.91,
        unit: 'km',
      },
      product_list: [
        {
          id: '2',
          name: 'Pizza hải sản',
          topping_list: [
            {
              name: 'Bánh mì',
              price: 5000,
            },
          ],
          price: 150000,
          order_count: 1,
          note: 'Thêm 1 gói tương',
        },
      ],
      locations: [
        {
          address: '8 Hoàng Văn Thụ',
          position: {
            lat: 16.06274057432445,
            lng: 108.22279661893845,
          },
        },
        {
          address: '132 Lê Đại Hành, Khuê Trung, Cẩm Lệ',
          position: {
            lng: 108.20193551443187,
            lat: 16.022926309895844,
          },
        },
      ],
      metadata: {
        image_url:
          'https://laco-merchants.10z.one/laco-assets/uploads/2022/08/pizza3.jpeg',
      },
    },
    status: 'ORDER_CREATED',
    created_at: '16:17 07/08/2023',
    updated_at: '16:20 07/08/2023',
}
};
