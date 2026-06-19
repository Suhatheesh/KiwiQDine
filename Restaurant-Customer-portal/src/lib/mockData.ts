import { MenuItem } from "../features/Menu/types";

export interface SizeOption {
    label: string;
    price: number;
}

export interface AddOnOption {
    label: string;
    price: number;
}

export interface ConfirmedItem {
    name: string;
    quantity: number;
    unitPrice: number;
    imageSrc: string;
}

export interface CartItem extends MenuItem {
    quantity: number;
}

export const sizes: SizeOption[] = [
    { label: 'Regular', price: 9.00 },
    { label: 'Small', price: 6.00 },
];

export const addOns: AddOnOption[] = [
    { label: 'Extra Cheese', price: 1.00 },
    { label: 'Bacon', price: 2.00 },
];

export const calculateTotal = (
    basePrice: number,
    quantity: number,
    selectedSizePrice: number,
    selectedAddOns: Set<string>
): string => {
    let totalPrice = basePrice;

    totalPrice += selectedSizePrice;

    addOns.forEach(addon => {
        if (selectedAddOns.has(addon.label)) {
            totalPrice += addon.price;
        }
    });

    return (totalPrice * quantity).toFixed(2);
};

export interface OrderItem {
    id: number;
    name: string;
    options: string;
    unitPrice: number;
    quantity: number;
    imageSrc: string; // For the image path
}

export const initialOrderItems: OrderItem[] = [
    {
        id: 1,
        name: 'Margherita Pizza',
        options: 'No Onions',
        unitPrice: 18.99,
        quantity: 2,
        imageSrc: 'https://images.pexels.com/photos/9620663/pexels-photo-9620663.jpeg?auto=compress&cs=tinysrgb&w=500'
    },
    {
        id: 2,
        name: 'Margherita Pizza',
        options: 'No Onions',
        unitPrice: 18.99,
        quantity: 2,
        imageSrc: 'https://images.pexels.com/photos/9620663/pexels-photo-9620663.jpeg?auto=compress&cs=tinysrgb&w=500'
    },
    {
        id: 3,
        name: 'Margherita Pizza',
        options: 'No Onions',
        unitPrice: 18.99,
        quantity: 2,
        imageSrc: 'https://images.pexels.com/photos/9620663/pexels-photo-9620663.jpeg?auto=compress&cs=tinysrgb&w=500'
    },
];

// export const MENU_ITEMS: MenuItem[] = [
//     {
//         id: '1',
//         name: 'Margherita Pizza',
//         price: 18.99,
//         image: 'https://images.pexels.com/photos/9620663/pexels-photo-9620663.jpeg?auto=compress&cs=tinysrgb&w=500',
//         category: 'Pizzas',
//     },
//     {
//         id: '2',
//         name: 'Margherita Pizza',
//         price: 18.99,
//         image: 'https://images.pexels.com/photos/9620663/pexels-photo-9620663.jpeg?auto=compress&cs=tinysrgb&w=500',
//         category: 'Pizzas',
//     },
//     {
//         id: '3',
//         name: 'Margherita Pizza',
//         price: 18.99,
//         image: 'https://images.pexels.com/photos/9620663/pexels-photo-9620663.jpeg?auto=compress&cs=tinysrgb&w=500',
//         category: 'Pizzas',
//     },
//     {
//         id: '4',
//         name: 'Margherita Pizza',
//         price: 18.99,
//         image: 'https://images.pexels.com/photos/9620663/pexels-photo-9620663.jpeg?auto=compress&cs=tinysrgb&w=500',
//         category: 'Pizzas',
//     },
//     {
//         id: '5',
//         name: 'Margherita Pizza',
//         price: 180.99,
//         image: 'https://images.pexels.com/photos/9620663/pexels-photo-9620663.jpeg?auto=compress&cs=tinysrgb&w=500',
//         category: 'Pizzas',
//     },
//     {
//         id: '6',
//         name: 'Margherita Pizza',
//         price: 1800.99,
//         image: 'https://images.pexels.com/photos/9620663/pexels-photo-9620663.jpeg?auto=compress&cs=tinysrgb&w=500',
//         category: 'Pizzas',
//     },
// ];

export const CATEGORIES = ['All Items', 'Pizzas', 'Burgers', 'Salad'];

export const confirmedItems: ConfirmedItem[] = [
    {
        name: 'Margherita Pizza',
        quantity: 1,
        unitPrice: 18.99,
        imageSrc: 'https://images.pexels.com/photos/9620663/pexels-photo-9620663.jpeg?auto=compress&cs=tinysrgb&w=500'
    },
    {
        name: 'Margherita Pizza',
        quantity: 1,
        unitPrice: 18.99,
        imageSrc: 'https://images.pexels.com/photos/9620663/pexels-photo-9620663.jpeg?auto=compress&cs=tinysrgb&w=500'
    },
];

export const orderDetails = {
    orderId: '#12345',
    date: 'Nov 11, 2025',
    time: '7:30PM',
    subTotal: 37.98, // 18.99 * 2
    discount: 0.00,
    totalPayment: 37.98,
};

export const summaryValues = {
    subTotal: 24.00,
    discount: 0.00,
    totalPayment: 24.00,
}
