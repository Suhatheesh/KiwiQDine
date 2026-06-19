// Note: This mapper needs to be refactored to match the new Restaurant entity structure
// The new Restaurant entity has: id, tenantId, name, logo, address, openHours, createdAt, updatedAt
// Old structure referenced: email, isActive, webUrl, logoUrl, timeZone, phoneNumber, opened, imageUrl, paymentMethod, openingHour, closingHour, location, singleclient

import { Injectable } from '@nestjs/common';
import { MenuMapper } from '../menu/menu.mapper';
import { AuditMapper } from './../audit/audit.mapper';
import { IMapper } from './../domain/mapper/mapper';
import { Restaurant as RestaurantEntity } from './../infrastructure/database/entities/restaurant.entity';
import { Restaurant } from './restaurant';

@Injectable()
export class RestaurantMapper implements IMapper<Restaurant, RestaurantEntity> {
  constructor(
    private readonly auditMapper: AuditMapper,
    private readonly menuMapper: MenuMapper,
  ) { }

  toPersistence(entity: Restaurant): RestaurantEntity {
    // Map domain entity to database entity
    const restaurantEntity = new RestaurantEntity();
    restaurantEntity.id = entity.id;
    restaurantEntity.name = entity.name;
    restaurantEntity.logo = (entity as any).logo || entity.logoUrl || null;
    restaurantEntity.address = (entity as any).address || null;
    restaurantEntity.contactEmail = (entity as any).contactEmail || entity.email || null;
    restaurantEntity.contactPhoneNumber = (entity as any).contactPhoneNumber || entity.phoneNumber || null;
    restaurantEntity.openTime = (entity as any).openTime || null;
    restaurantEntity.closeTime = (entity as any).closeTime || null;
    restaurantEntity.openHours = (entity as any).openHours || null;
    restaurantEntity.paymentTiming = (entity as any).paymentTiming || 'pay_at_last';
    restaurantEntity.walletBalance = (entity as any).walletBalance || 0;
    restaurantEntity.tenantId = (entity as any).tenantId || null;
    restaurantEntity.isActive = entity.isActive;
    restaurantEntity.primaryColor = entity.primaryColor || null;
    restaurantEntity.secondaryColor = entity.secondaryColor || null;
    restaurantEntity.tertiaryColor = entity.tertiaryColor || null;
    // Service charge fields
    restaurantEntity.serviceChargePercentage = (entity as any).serviceChargePercentage ?? 0;
    restaurantEntity.applyServiceCharge = (entity as any).applyServiceCharge ?? false;
    restaurantEntity.serviceChargeType = (entity as any).serviceChargeType || 'percentage';
    restaurantEntity.fixedServiceCharge = (entity as any).fixedServiceCharge || null;
    restaurantEntity.requireWaiterConfirmation = (entity as any).requireWaiterConfirmation ?? false;
    restaurantEntity.gracePeriodStartDate = (entity as any).gracePeriodStartDate || null;
    restaurantEntity.gracePeriodEndDate = (entity as any).gracePeriodEndDate || null;
    // Note: createdAt and updatedAt are handled by TypeORM automatically
    return restaurantEntity;
  }

  toDomain(document: RestaurantEntity): Restaurant {
    // Map the new Restaurant entity structure to domain entity
    const entity: Restaurant = Restaurant.create(
      {
        name: document.name,
        email: document.contactEmail || '',
        isActive: document.isActive ?? true,
        webUrl: '',
        logoUrl: document.logo || '',
        phoneNumber: document.contactPhoneNumber || '',
        timeZone: '',
        opened: true,
        imageUrl: '',
        paymentMethod: 'CASH' as any,
        openingHour: 0,
        closingHour: 0,
        menus: document.menus?.length ? document.menus.map((menu) => this.menuMapper.toDomain(menu as any)) : [],
        location: {
          id: '',
          address: document.address?.lane || '',
          city: document.address?.city || '',
          state: document.address?.district || '',
          zipCode: '',
          country: document.address?.country || '',
          latitude: 0,
          longitude: 0,
          audit: {} as any,
        } as any,
        audit: this.auditMapper.toDomain({
          auditCreatedDateTime: document.createdAt,
          auditCreatedBy: '',
          auditModifiedBy: '',
          auditModifiedDateTime: document.updatedAt,
        } as any),
        primaryColor: document.primaryColor,
        secondaryColor: document.secondaryColor,
        tertiaryColor: document.tertiaryColor,
        gracePeriodStartDate: document.gracePeriodStartDate,
        gracePeriodEndDate: document.gracePeriodEndDate,
      },
      document.id,
    ).getValue();

    // Store additional fields from new entity structure as properties on the domain entity
    // These will be accessed directly from the entity document in the parser
    (entity as any).tenantId = document.tenantId;
    (entity as any).logo = document.logo;
    (entity as any).address = document.address;
    (entity as any).contactEmail = document.contactEmail;
    (entity as any).contactPhoneNumber = document.contactPhoneNumber;
    (entity as any).openTime = document.openTime;
    (entity as any).closeTime = document.closeTime;
    (entity as any).openHours = document.openHours;
    (entity as any).paymentTiming = document.paymentTiming || 'pay_at_last';
    (entity as any).walletBalance = Number(document.walletBalance) || 0;
    (entity as any).walletTotalEarned = Number(document.walletTotalEarned) || 0;
    (entity as any).walletTotalWithdrawn = Number(document.walletTotalWithdrawn) || 0;
    (entity as any).primaryColor = document.primaryColor;
    (entity as any).secondaryColor = document.secondaryColor;
    (entity as any).tertiaryColor = document.tertiaryColor;
    // Service charge fields
    (entity as any).serviceChargePercentage = Number(document.serviceChargePercentage) || 0;
    (entity as any).applyServiceCharge = document.applyServiceCharge ?? false;
    (entity as any).serviceChargeType = document.serviceChargeType || 'percentage';
    (entity as any).fixedServiceCharge = document.fixedServiceCharge ? Number(document.fixedServiceCharge) : null;
    (entity as any).requireWaiterConfirmation = document.requireWaiterConfirmation ?? false;

    return entity;
  }
}