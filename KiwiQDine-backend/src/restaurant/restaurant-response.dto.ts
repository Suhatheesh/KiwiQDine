import { IMenuResponseDTO } from './../menu/menu-response.dto';

import { IAudit } from './../infrastructure/database/mongoDB/base-document.interface';
import { ILocationResponseDTO } from './../location/location-response.dto';

export interface IRestaurantAddressResponse {
  lane?: string;
  city?: string;
  district?: string;
  country?: string;
}

export interface IRestaurantSubscriptionResponse {
  id: string;
  planId: string;
  planName: string;
  planCode: string;
  billingCycle: string;
  startDate: string;
  endDate: string | null;
  status: string;
  isAutoRenew: boolean;
  priceMonthly?: string | null;
  priceYearly?: string | null;
  orderLimit?: number | null;
  features?: string[];
  // Usage and limit tracking
  completedOrders?: number; // Count of completed orders in current month
  overageCount?: number;      // Orders exceeding the limit
  additionalCharges?: number; // Calculated charge for excess orders (e.g. overageCount * 100)
  isOverLimit?: boolean;      // Flag if restaurant has exceeded limit
}

export interface IRestaurantResponseDTO extends IAudit {
  id: string;
  tenantId?: string;
  name: string;
  logo?: string;
  address?: IRestaurantAddressResponse;
  contactEmail?: string;
  contactPhoneNumber?: string;
  openTime?: string; // e.g., "09:00"
  closeTime?: string; // e.g., "22:00"
  openHours?: Record<string, string>; // e.g., { "mon-fri": "10:00-22:00", "sat-sun": "09:00-23:00" }
  paymentTiming?: 'pay_at_first' | 'pay_at_last'; // Payment timing: pay_at_first (customer pays before eating) or pay_at_last (customer pays after eating)
  walletBalance?: number; // Current wallet balance
  subscription?: IRestaurantSubscriptionResponse | null; // Active subscription plan
  // Legacy fields for backward compatibility
  email?: string;
  logoUrl?: string;
  isActive?: boolean;
  webUrl?: string;
  timeZone?: string;
  location: ILocationResponseDTO;
  menus: IMenuResponseDTO[];
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  serviceChargePercentage?: number;
  applyServiceCharge?: boolean;
  serviceChargeType?: 'percentage' | 'fixed';
  fixedServiceCharge?: number;
  requireWaiterConfirmation?: boolean;
  gracePeriodStartDate?: string | null;
  gracePeriodEndDate?: string | null;
}
