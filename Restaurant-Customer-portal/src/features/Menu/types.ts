import { InitialCommonType } from "../../model/BaseType";

export interface MenuFilter {
    categoryId?: string
    minPrice?: number
    maxPrice?: number
    search?: string
    hasDiscount?: boolean
    isTopSelling?: boolean
    isFeatured?: boolean
    sortBy?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'best_match' | ''
    page?: number
    limit?: number
}

export interface MenuItem extends CreateMenuItemRequest {
    id: string;
    restaurantId: string
    restaurant?: Restaurant
    categoryId: string
    category?: MenuCategory
    badges?: Badge[]
    createdAt?: string;
    addons?: AddonsResponse[]
}

export interface AddonsResponse {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string | null;
    imageKey: string | null;
    type: "single" | "multiple";
    status: "active" | "inactive";
    isRequired: boolean;
    maxSelection: number;
}

export interface CreateMenuItemRequest {
    name: string;
    description?: string;
    note?: string;
    price: number;
    image?: string;
    restaurantId: string;
    categoryId: string;
    discount?: number;
    quantityAvailable?: number;
    preparationTime?: number;
    isAvailable?: boolean;
    availableFrom?: string;
    availableTo?: string;
    variantOptions?: VariantType[]
    id?: string;
    menuAddons?: MenuAddons[]
}

export interface MenuAddons {
    id: string;
    menuId: string;
    addonId: string;
    addon: AddOn;
    overridePrice: number;
    isRequired: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface AddOn {
    name: string;
    description: string;
    unitPrice: string;
    menuIds?: string[];
    quantity: number;
    restaurantId: string;
    id?: string;
}

export interface VariantType {
    id?: number;
    name: string;
    type: 'single' | 'multiple';
    required?: boolean;
    options?: OptionType[];
}

export interface OptionType {
    // id?: number;
    name: string;
    price?: number;
    priceModifier?: number;
    // isDefault?: boolean;
}

export interface Restaurant {
    id?: string;
    name: string;
    address: string;
    logo: string;
    contactEmail: string;
    contactPhoneNumber: string;
    openTime?: string | null;
    paymentTiming?: string | null;
    closeTime?: string | null;
    openHours?: string | null;
}

export interface MenuCategory {
    id: string;
    name: string;
    code?: string;
    description?: string;
    image?: string;
    displayOrder?: number;
    isShowcase?: boolean;
    isFeatured?: boolean;
}

export interface Badge {
    id: string;
    restaurantId: string;
    name: string;
    code: string;
    description: string;
    icon: string;
    backgroundColor: string;
    textColor: string;
    displayOrder: number;
    isActive: boolean;
    isSystem: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface MenuPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface MenuAPIResponse {
    items?: MenuItem[];
    pagination: MenuPagination;
}

export interface InitialMenuType extends InitialCommonType, MenuAPIResponse {
    isPaginationLoading?: boolean
    categories?: MenuCategory[]
    featuredMenu?: MenuItem[]
}