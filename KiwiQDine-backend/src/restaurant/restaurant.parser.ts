import { MenuParser } from './../menu/menu.parser';
import { AuditParser } from './../audit/audit.parser';
import { LocationParser } from './../location/location.parser';
import { Restaurant } from './restaurant';
import { IRestaurantResponseDTO } from './restaurant-response.dto';
export class RestaurantParser {
  static createRestaurantResponse(restaurant: Restaurant | any): IRestaurantResponseDTO {
    const { audit, location, menus, subscriptions } = restaurant;
    const auditResponse = audit ? { ...AuditParser.createAuditResponse(audit) } : undefined;

    console.log('[RestaurantParser] Input restaurant subscriptions:', subscriptions);
    console.log('[RestaurantParser] Subscriptions is array:', Array.isArray(subscriptions));
    console.log('[RestaurantParser] Subscriptions length:', subscriptions?.length);

    // Get active subscription
    const activeSubscription = subscriptions?.find((sub: any) => sub.status === 'active');
    console.log('[RestaurantParser] Active subscription found:', !!activeSubscription);
    console.log('[RestaurantParser] Active subscription data:', activeSubscription);

    const subscription = activeSubscription ? {
      id: activeSubscription.id,
      planId: activeSubscription.planId,
      planName: activeSubscription.plan?.name,
      planCode: activeSubscription.plan?.code,
      billingCycle: activeSubscription.billingCycle,
      startDate: activeSubscription.startDate,
      endDate: activeSubscription.endDate,
      status: activeSubscription.status,
      isAutoRenew: activeSubscription.isAutoRenew,
      priceMonthly: activeSubscription.plan?.priceMonthly,
      priceYearly: activeSubscription.plan?.priceYearly,
      orderLimit: activeSubscription.plan?.orderLimit,
      features: activeSubscription.plan?.features,
    } : null;

    console.log('[RestaurantParser] Created subscription object:', subscription);

    const restaurantResponse: IRestaurantResponseDTO = {
      id: restaurant.id,
      tenantId: restaurant.tenantId || (restaurant as any).tenantId,
      name: restaurant.name,
      logo: (restaurant as any).logo || restaurant.logoUrl,
      logoUrl: restaurant.logoUrl || (restaurant as any).logo,
      address: (restaurant as any).address || undefined,
      contactEmail: (restaurant as any).contactEmail || restaurant.email,
      contactPhoneNumber: (restaurant as any).contactPhoneNumber || restaurant.phoneNumber,
      openTime: (restaurant as any).openTime,
      closeTime: (restaurant as any).closeTime,
      openHours: (restaurant as any).openHours,
      paymentTiming: (restaurant as any).paymentTiming || 'pay_at_last',
      walletBalance: (restaurant as any).walletBalance || 0,
      // Legacy fields for backward compatibility
      email: restaurant.email || (restaurant as any).contactEmail,
      isActive: restaurant.isActive,
      webUrl: restaurant.webUrl,
      timeZone: restaurant.timeZone,
      menus: MenuParser.createMenusResponse(menus || []),
      location: LocationParser.createLocationResponse(location),
      primaryColor: (restaurant as any).primaryColor,
      secondaryColor: (restaurant as any).secondaryColor,
      tertiaryColor: (restaurant as any).tertiaryColor,
      serviceChargePercentage: (restaurant as any).serviceChargePercentage,
      applyServiceCharge: (restaurant as any).applyServiceCharge,
      serviceChargeType: (restaurant as any).serviceChargeType,
      fixedServiceCharge: (restaurant as any).fixedServiceCharge,
      requireWaiterConfirmation: (restaurant as any).requireWaiterConfirmation,
      gracePeriodStartDate: (restaurant as any).gracePeriodStartDate || (restaurant as any)._gracePeriodStartDate,
      gracePeriodEndDate: (restaurant as any).gracePeriodEndDate || (restaurant as any)._gracePeriodEndDate,
      subscription: subscription,
      ...auditResponse,
    };
    return restaurantResponse;
  }

  static createRestaurantsParser(restaurants: Restaurant[]): IRestaurantResponseDTO[] {
    return restaurants.length ? restaurants.map((restaurant) => this.createRestaurantResponse(restaurant)) : [];
  }
}
