
import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericTypeOrmRepository } from '../../../infrastructure/database/typeorm/generic-typeorm.repository';
import { Restaurant } from './../../../restaurant/restaurant';
import { RestaurantMapper } from './../../../restaurant/restaurant.mapper';
import { IRestaurantRepository } from './interfaces/restaurant-repository.interface';
import { throwApplicationError } from '../../../infrastructure/utilities/exception-instance';
import { Restaurant as RestaurantEntity } from '../../../infrastructure/database/entities/restaurant.entity';
import { PaginationResponse } from '../../../shared/dto/enhanced-pagination.dto';

@Injectable()
export class RestaurantRepository
  extends GenericTypeOrmRepository<Restaurant, RestaurantEntity>
  implements IRestaurantRepository {
  restaurantMapper: RestaurantMapper;
  constructor(
    @InjectRepository(RestaurantEntity) repository: Repository<RestaurantEntity>,
    restaurantMapper: RestaurantMapper
  ) {
    super(repository, restaurantMapper);
    this.restaurantMapper = restaurantMapper;
  }

  async getRestaurant(restaurantId: string): Promise<Restaurant> {
    const restaurantDoc = await this.repository.findOne({
      where: { id: restaurantId },
      relations: ['tenant', 'subscriptions', 'subscriptions.plan']
    });
    if (!restaurantDoc) {
      throwApplicationError(HttpStatus.NOT_FOUND, `Restaurant with id ${restaurantId} does not exist`);
    }
    const restaurant: Restaurant = this.restaurantMapper.toDomain(restaurantDoc);
    // Attach entity fields directly to domain object for access in parser
    (restaurant as any).tenantId = restaurantDoc.tenantId;
    (restaurant as any).logo = restaurantDoc.logo;
    (restaurant as any).logoKey = restaurantDoc.logoKey;
    (restaurant as any).banner = restaurantDoc.banner;
    (restaurant as any).bannerKey = restaurantDoc.bannerKey;
    (restaurant as any).address = restaurantDoc.address;
    (restaurant as any).contactEmail = restaurantDoc.contactEmail;
    (restaurant as any).contactPhoneNumber = restaurantDoc.contactPhoneNumber;
    (restaurant as any).openTime = restaurantDoc.openTime;
    (restaurant as any).closeTime = restaurantDoc.closeTime;
    (restaurant as any).openHours = restaurantDoc.openHours;
    (restaurant as any).isActive = restaurantDoc.isActive;
    (restaurant as any).paymentTiming = restaurantDoc.paymentTiming;
    (restaurant as any).walletBalance = restaurantDoc.walletBalance;
    (restaurant as any).walletTotalEarned = restaurantDoc.walletTotalEarned;
    (restaurant as any).walletTotalWithdrawn = restaurantDoc.walletTotalWithdrawn;
    (restaurant as any).subscriptions = restaurantDoc.subscriptions;
    (restaurant as any).primaryColor = restaurantDoc.primaryColor;
    (restaurant as any).secondaryColor = restaurantDoc.secondaryColor;
    (restaurant as any).tertiaryColor = restaurantDoc.tertiaryColor;
    (restaurant as any).serviceChargePercentage = restaurantDoc.serviceChargePercentage;
    (restaurant as any).applyServiceCharge = restaurantDoc.applyServiceCharge;
    (restaurant as any).serviceChargeType = restaurantDoc.serviceChargeType;
    (restaurant as any).fixedServiceCharge = restaurantDoc.fixedServiceCharge;
    (restaurant as any).bankDetails = restaurantDoc.bankDetails;
    (restaurant as any).createdAt = restaurantDoc.createdAt;
    (restaurant as any).updatedAt = restaurantDoc.updatedAt;
    return restaurant;
  }

  async getRestaurants(): Promise<Restaurant[]> {
    const restaurantDocs = await this.repository.find({
      relations: ['tenant', 'subscriptions', 'subscriptions.plan']
    });
    const restaurants: Restaurant[] = restaurantDocs.map((doc) => {
      const domain = this.restaurantMapper.toDomain(doc);
      // Attach entity fields directly to domain object for access in parser
      (domain as any).tenantId = doc.tenantId;
      (domain as any).logo = doc.logo;
      (domain as any).logoKey = doc.logoKey;
      (domain as any).banner = doc.banner;
      (domain as any).bannerKey = doc.bannerKey;
      (domain as any).address = doc.address;
      (domain as any).contactEmail = doc.contactEmail;
      (domain as any).contactPhoneNumber = doc.contactPhoneNumber;
      (domain as any).openTime = doc.openTime;
      (domain as any).closeTime = doc.closeTime;
      (domain as any).openHours = doc.openHours;
      (domain as any).isActive = doc.isActive;
      (domain as any).paymentTiming = doc.paymentTiming;
      (domain as any).walletBalance = doc.walletBalance;
      (domain as any).walletTotalEarned = doc.walletTotalEarned;
      (domain as any).walletTotalWithdrawn = doc.walletTotalWithdrawn;
      (domain as any).subscriptions = doc.subscriptions;
      (domain as any).primaryColor = doc.primaryColor;
      (domain as any).secondaryColor = doc.secondaryColor;
      (domain as any).tertiaryColor = doc.tertiaryColor;
      (domain as any).serviceChargePercentage = doc.serviceChargePercentage;
      (domain as any).applyServiceCharge = doc.applyServiceCharge;
      (domain as any).serviceChargeType = doc.serviceChargeType;
      (domain as any).fixedServiceCharge = doc.fixedServiceCharge;
      (domain as any).bankDetails = doc.bankDetails;
      (domain as any).createdAt = doc.createdAt;
      (domain as any).updatedAt = doc.updatedAt;
      return domain;
    });
    return restaurants;
  }

  async getRestaurantsWithFilters(filters: any): Promise<PaginationResponse<Restaurant>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // Build query builder for search across multiple fields
    const queryBuilder = this.repository.createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.tenant', 'tenant')
      .leftJoinAndSelect('restaurant.subscriptions', 'subscriptions')
      .leftJoinAndSelect('subscriptions.plan', 'plan');

    // Apply search if provided - search in name, address, contactEmail, contactPhoneNumber
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      queryBuilder.where(
        `(restaurant.name ILIKE :search
          OR restaurant.address ->> 'lane' ILIKE :search
          OR restaurant.address ->> 'city' ILIKE :search
          OR restaurant.address ->> 'district' ILIKE :search
          OR restaurant.address ->> 'country' ILIKE :search
          OR restaurant.contactEmail ILIKE :search
          OR restaurant.contactPhoneNumber ILIKE :search)`,
        { search: searchTerm }
      );
    }

    // Apply filters
    if (filters.tenantId) {
      queryBuilder.andWhere('restaurant.tenantId = :tenantId', { tenantId: filters.tenantId });
    }

    // Filter by city
    if (filters.city) {
      queryBuilder.andWhere("restaurant.address ->> 'city' = :city", { city: filters.city });
    }

    // Filter by district
    if (filters.district) {
      queryBuilder.andWhere("restaurant.address ->> 'district' = :district", { district: filters.district });
    }

    // Filter by status
    if (filters.status) {
      queryBuilder.andWhere('restaurant.status = :status', { status: filters.status });
    }

    // Filter by Subscription Plan
    if (filters.planId) {
      queryBuilder.andWhere('plan.id = :planId', { planId: filters.planId });
    } else if (filters.planCode) {
      queryBuilder.andWhere('plan.code = :planCode', { planCode: filters.planCode.toLowerCase() });
    }

    // Filter by Wallet Balance
    if (filters.minWalletBalance !== undefined && filters.minWalletBalance !== null) {
      queryBuilder.andWhere('restaurant.walletBalance >= :minWallet', { minWallet: filters.minWalletBalance });
    }
    if (filters.maxWalletBalance !== undefined && filters.maxWalletBalance !== null) {
      queryBuilder.andWhere('restaurant.walletBalance <= :maxWallet', { maxWallet: filters.maxWalletBalance });
    }

    // Filter by Over-usage (Exceeding Subscription Limit)
    if (filters.isOverLimit === true || filters.isOverLimit === false) {
      const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      // We only consider active plans with a limit
      // If isOverLimit is true, we find restaurants where completed orders > plan.orderLimit
      // If isOverLimit is false, we find restaurants where completed orders <= plan.orderLimit (or unlimited)

      const operator = filters.isOverLimit ? '>' : '<=';

      queryBuilder.andWhere(qb => {
        const subQuery = qb.subQuery()
          .select("COUNT(order_sub.id)")
          .from("orders", "order_sub")
          .where("order_sub.restaurantId = restaurant.id")
          .andWhere("order_sub.status = 'completed'")
          .andWhere("order_sub.createdAt >= :monthStart", { monthStart: currentMonthStart })
          .getQuery();

        if (filters.isOverLimit) {
          // Must have a limit and be over it
          return `(${subQuery}) > plan.orderLimit AND plan.orderLimit IS NOT NULL AND plan.orderLimit > 0`;
        } else {
          // Either under limit or unlimited
          return `(plan.orderLimit IS NULL OR plan.orderLimit = 0 OR (${subQuery}) <= plan.orderLimit)`;
        }
      });
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';
    const allowedSortFields = ['name', 'address', 'contactEmail', 'contactPhoneNumber', 'createdAt', 'updatedAt'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    if (finalSortBy === 'address') {
      queryBuilder.orderBy(`restaurant.address ->> 'lane'`, sortOrder as 'ASC' | 'DESC');
    } else {
      queryBuilder.orderBy(`restaurant.${finalSortBy}`, sortOrder as 'ASC' | 'DESC');
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const restaurantDocs = await queryBuilder.getMany();
    const restaurants: Restaurant[] = restaurantDocs.map((doc) => {
      const domain = this.restaurantMapper.toDomain(doc);
      // Attach entity fields directly to domain object for access in parser
      (domain as any).tenantId = doc.tenantId;
      (domain as any).logo = doc.logo;
      (domain as any).address = doc.address;
      (domain as any).contactEmail = doc.contactEmail;
      (domain as any).contactPhoneNumber = doc.contactPhoneNumber;
      (domain as any).openTime = doc.openTime;
      (domain as any).closeTime = doc.closeTime;
      (domain as any).openHours = doc.openHours;
      (domain as any).isActive = doc.isActive;
      (domain as any).subscriptions = doc.subscriptions;
      (domain as any).serviceChargePercentage = doc.serviceChargePercentage;
      (domain as any).applyServiceCharge = doc.applyServiceCharge;
      (domain as any).serviceChargeType = doc.serviceChargeType;
      (domain as any).fixedServiceCharge = doc.fixedServiceCharge;
      return domain;
    });

    return {
      data: restaurants,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

}
