export type PaymentMethod = 'card' | 'cash' | 'cashier';

export enum PaymentTiming {
    PAY_AT_LAST = 'pay_at_last',
    PAY_AT_FIRST = 'pay_at_first'
}

export enum OrderStatusTypes {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    PREPARING = 'preparing',
    READY = 'ready',
    INPROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    HOLD = 'hold',
    SERVED = 'served'
}

export enum OrderType {
    TAKEAWAY = 'takeaway',
    DINEIN = 'dine_in',
    PARKING = 'parking'
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    FAILED = 'failed'
}

export enum RestaurantType {
    RESTAURANT = 'restaurant',
    FOOD_COURT = 'food_court'
}