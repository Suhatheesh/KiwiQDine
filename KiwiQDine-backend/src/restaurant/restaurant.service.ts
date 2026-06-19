import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Context } from '../infrastructure/context';
import { TYPES } from './../application/constants/types';
import { Audit } from './../domain/audit/audit';
import { Result } from './../domain/result/result';
import { IContextService } from './../infrastructure/context/context-service.interface';
import { IRestaurantRepository } from './../infrastructure/data_access/repositories/interfaces';
import { throwApplicationError } from './../infrastructure/utilities/exception-instance';
import { CreateRestaurantDTO } from './create-restaurant.dto';
import { Restaurant } from './restaurant';
import { IRestaurantResponseDTO } from './restaurant-response.dto';
import { IRestaurantService } from './restaurant-service.interface';
import { RestaurantMapper } from './restaurant.mapper';
import { RestaurantParser } from './restaurant.parser';
import { Location } from '../location/location';
import { LocationMapper } from '../location/location.mapper';
import { EnhancedPaginationDto, PaginationResponse } from '../shared/dto/enhanced-pagination.dto';
import { SubscriptionService } from '../subscription/subscription.service';
import { UpdateRestaurantWalletDto } from '@/customer-portal/dto/update-restaurant-wallet.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus, SubscriptionPlanEntity } from '@/infrastructure/database/entities';
import { S3Service } from '@/shared/services/s3.service';
import { parse } from 'path';
@Injectable()
export class RestaurantService implements IRestaurantService {
  private readonly logger = new Logger(RestaurantService.name);
  constructor(
    @Inject(TYPES.IRestaurantRepository)
    private readonly restaurantRepository: IRestaurantRepository,
    private readonly restaurantMapper: RestaurantMapper,
    private readonly locationMapper: LocationMapper,
    @Inject(TYPES.IContextService) private readonly contextService: IContextService,
    private readonly subscriptionService: SubscriptionService,
    private readonly configService: ConfigService,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly s3Service: S3Service,
    @InjectRepository(SubscriptionPlanEntity)
    private readonly planRepository: Repository<SubscriptionPlanEntity>,
  ) { }

  async createRestaurant(props: CreateRestaurantDTO): Promise<Result<IRestaurantResponseDTO>> {
    const context: Context = this.contextService.getContext();
    const {
      name,
      email,
      phoneNumber,
      tenantId,
      address,
      contactEmail,
      contactPhoneNumber,
      logo,
      openTime,
      closeTime,
      openHours,
      requireWaiterConfirmation,
    } = props;
    const existingRestaurant: Result<Restaurant> = await this.restaurantRepository.findOne({
      where: { name },
    });
    if (existingRestaurant.isSuccess && existingRestaurant.getValue().name === name) {
      throwApplicationError(HttpStatus.BAD_REQUEST, `Restaurant with name ${name} already exists`);
    }

    // Create location
    const audit: Audit = Audit.createInsertContext(context);
    let location: Location;
    if (props.location) {
      location = Location.create({ ...props.location, audit }, undefined).getValue();
    } else {
      const addressLane = address?.lane || 'Not specified';
      const addressCity = address?.city || 'Not specified';
      const addressCountry = address?.country || 'Not specified';
      const addressDistrict = address?.district || 'Not specified';
      const locationData = {
        address: addressLane,
        city: addressCity,
        country: addressCountry,
        postCode: '00000',
        state: addressDistrict,
        audit,
      };
      location = Location.create(locationData, undefined).getValue();
    }

    const restaurant: Restaurant = Restaurant.create({
      name,
      email: contactEmail || email || '',
      phoneNumber: contactPhoneNumber || phoneNumber || '',
      audit,
      isActive: props.isActive ?? true,
      opened: props.opened ?? false,
      imageUrl: props.imageUrl || '',
      location,
      openingHour: props.openingHour ?? 0,
      closingHour: props.closingHour ?? 24,
      paymentMethod: props.paymentMethod || [],
      menus: props.menus || [],
      webUrl: props.webUrl,
      logoUrl: logo || props.logoUrl,
      timeZone: props.timeZone,
      requireWaiterConfirmation: props.requireWaiterConfirmation ?? false,
    }).getValue();

    // Attach new entity fields directly to domain object
    (restaurant as any).tenantId = tenantId;
    (restaurant as any).logo = logo || props.logoUrl;
    (restaurant as any).address = address || null;
    (restaurant as any).contactEmail = contactEmail || email;
    (restaurant as any).contactPhoneNumber = contactPhoneNumber || phoneNumber;
    (restaurant as any).openTime = openTime;
    (restaurant as any).closeTime = closeTime;
    (restaurant as any).openHours = openHours;
    (restaurant as any).requireWaiterConfirmation = requireWaiterConfirmation ?? false;
    (restaurant as any).paymentTiming = props.paymentTiming || 'pay_at_last';
    (restaurant as any).primaryColor = props.primaryColor;
    (restaurant as any).secondaryColor = props.secondaryColor;
    (restaurant as any).tertiaryColor = props.tertiaryColor;

    const restaurantModel = this.restaurantMapper.toPersistence(restaurant);
    restaurantModel.primaryColor = props.primaryColor;
    restaurantModel.secondaryColor = props.secondaryColor;
    restaurantModel.tertiaryColor = props.tertiaryColor;

    const docResult = await this.restaurantRepository.create(restaurantModel);
    if (!docResult.isSuccess) {
      throwApplicationError(HttpStatus.SERVICE_UNAVAILABLE, 'Error while creating restaurant');
    }
    const newRestaurant = docResult.getValue();

    //await this.assignDefaultSubscription(newRestaurant.id);
    const restaurantWithDetails = await this.restaurantRepository.getRestaurant(newRestaurant.id);

    return Result.ok(
      RestaurantParser.createRestaurantResponse(restaurantWithDetails),
      'Restaurant created successfully',
    );
  }

  async updateRestaurant(id: string, props: any): Promise<Result<IRestaurantResponseDTO>> {
    try {
      console.log('[RestaurantService] Updating restaurant:', id, 'with props:', JSON.stringify(props));

      // Build update object with only the fields that are provided
      const updateData: any = {};

      if (props.name !== undefined) updateData.name = props.name;
      if (props.logo !== undefined) updateData.logo = props.logo;
      if (props.address !== undefined) updateData.address = props.address;
      if (props.contactEmail !== undefined) updateData.contactEmail = props.contactEmail;
      if (props.contactPhoneNumber !== undefined) updateData.contactPhoneNumber = props.contactPhoneNumber;
      if (props.openTime !== undefined) updateData.openTime = props.openTime;
      if (props.closeTime !== undefined) updateData.closeTime = props.closeTime;
      if (props.openHours !== undefined) updateData.openHours = props.openHours;
      if (props.paymentTiming !== undefined) updateData.paymentTiming = props.paymentTiming;
      if (props.isActive !== undefined) updateData.isActive = props.isActive;
      if (props.primaryColor !== undefined) updateData.primaryColor = props.primaryColor;
      if (props.secondaryColor !== undefined) updateData.secondaryColor = props.secondaryColor;
      if (props.tertiaryColor !== undefined) updateData.tertiaryColor = props.tertiaryColor;
      if (props.requireWaiterConfirmation !== undefined) updateData.requireWaiterConfirmation = props.requireWaiterConfirmation;

      // Service charge fields
      if (props.serviceChargePercentage !== undefined) updateData.serviceChargePercentage = props.serviceChargePercentage;
      if (props.applyServiceCharge !== undefined) updateData.applyServiceCharge = props.applyServiceCharge;
      if (props.serviceChargeType !== undefined) updateData.serviceChargeType = props.serviceChargeType;
      if (props.fixedServiceCharge !== undefined) updateData.fixedServiceCharge = props.fixedServiceCharge;

      // Update timestamp
      updateData.updatedAt = new Date();

      // First fetch the existing restaurant entity
      const existingRestaurant = await (this.restaurantRepository as any).repository.findOne({
        where: { id },
        relations: ['tenant', 'subscriptions', 'subscriptions.plan']
      });

      if (!existingRestaurant) {
        return Result.fail('Restaurant not found', HttpStatus.NOT_FOUND);
      }

      // Merge the update data into the existing entity
      const mergedRestaurant = (this.restaurantRepository as any).repository.merge(existingRestaurant, updateData);

      // Save the merged entity (this preserves relations)
      await (this.restaurantRepository as any).repository.save(mergedRestaurant);

      // Fetch the updated restaurant using the repository method
      const updatedRestaurant = await this.restaurantRepository.getRestaurant(id);

      console.log('[RestaurantService] Updated restaurant raw data:', JSON.stringify(updatedRestaurant, null, 2));
      console.log('[RestaurantService] Updated restaurant type:', typeof updatedRestaurant);
      console.log('[RestaurantService] Has subscriptions property:', 'subscriptions' in (updatedRestaurant as any));
      console.log('[RestaurantService] Subscriptions value:', (updatedRestaurant as any).subscriptions);

      const restaurantResponse = RestaurantParser.createRestaurantResponse(updatedRestaurant);

      console.log('[RestaurantService] Restaurant response subscription:', restaurantResponse.subscription);

      // Enrich with subscription usage data
      try {
        const usageDetails = await this.subscriptionService.getRestaurantSubscriptionUsage(id);
        console.log('[RestaurantService] Usage details:', usageDetails);

        if (restaurantResponse.subscription) {
          const plan = await this.planRepository.findOne({ where: { id: restaurantResponse.subscription.planId } });

          restaurantResponse.subscription.completedOrders = usageDetails.usage.completedOrders;
          restaurantResponse.subscription.overageCount = usageDetails.usage.overageCount;
          restaurantResponse.subscription.isOverLimit = usageDetails.usage.isOverLimit;
          restaurantResponse.subscription.additionalCharges = (usageDetails.usage.overageCount || 0) * parseFloat(plan.overageChargePerInvoice);
          console.log('[RestaurantService] Enriched subscription:', restaurantResponse.subscription);
        } else {
          console.log('[RestaurantService] No subscription in response, cannot enrich');
        }
      } catch (error) {
        this.logger.error(`Error fetching subscription usage for restaurant ${id}: ${error.message}`);
        console.error('[RestaurantService] Full error:', error);
      }

      return Result.ok(
        restaurantResponse,
        'Restaurant updated successfully',
      );
    } catch (error) {
      console.error('[RestaurantService] Error updating restaurant:', error);
      console.error('[RestaurantService] Error stack:', error.stack);
      return Result.fail('Failed to update restaurant', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteRestaurant(id: string): Promise<Result<boolean>> {
    const result = await this.restaurantRepository.deleteOne({ id });
    return Result.ok(result, 'Restaurant deleted successfully');
  }

  async getRestaurants(): Promise<Result<IRestaurantResponseDTO[]>> {
    // Note: validateContext() removed - this endpoint uses AccessAuthGuard which validates JWT tokens
    // SingleClient context validation is not needed for regular authenticated users
    const restaurants: Restaurant[] = await this.restaurantRepository.getRestaurants();
    const restaurantsResponse = RestaurantParser.createRestaurantsParser(restaurants);

    // Enrich with subscription usage data
    const enrichedResponse = await Promise.all(
      restaurantsResponse.map(async (res) => {
        try {
          const usageDetails = await this.subscriptionService.getRestaurantSubscriptionUsage(res.id);
          if (res.subscription) {
            const plan = await this.planRepository.findOne({ where: { id: res.subscription.planId } });

            res.subscription.completedOrders = usageDetails.usage.completedOrders;
            res.subscription.overageCount = usageDetails.usage.overageCount;
            res.subscription.isOverLimit = usageDetails.usage.isOverLimit;
            res.subscription.additionalCharges = (usageDetails.usage.overageCount || 0) * parseFloat(plan.overageChargePerInvoice);
          }
          return res;
        } catch (error) {
          return res;
        }
      })
    );

    return Result.ok(enrichedResponse, 'Restaurants retrieved successfully');
  }

  async getRestaurantsWithFilters(filters: EnhancedPaginationDto): Promise<Result<PaginationResponse<IRestaurantResponseDTO>>> {
    // Note: validateContext() removed - this endpoint uses AccessAuthGuard which validates JWT tokens
    // SingleClient context validation is not needed for regular authenticated users
    const result = await this.restaurantRepository.getRestaurantsWithFilters(filters);
    const restaurantsResponse = result.data.map((restaurant) => RestaurantParser.createRestaurantResponse(restaurant));

    // Enrich with subscription usage data
    const enrichedResponse = await Promise.all(
      restaurantsResponse.map(async (res) => {
        try {
          const usageDetails = await this.subscriptionService.getRestaurantSubscriptionUsage(res.id);
          if (res.subscription) {
            const plan = await this.planRepository.findOne({ where: { id: res.subscription.planId } });

            res.subscription.completedOrders = usageDetails.usage.completedOrders;
            res.subscription.overageCount = usageDetails.usage.overageCount;
            res.subscription.isOverLimit = usageDetails.usage.isOverLimit;
            res.subscription.additionalCharges = (usageDetails.usage.overageCount || 0) * parseFloat(plan.overageChargePerInvoice);
          }
          return res;
        } catch (error) {
          return res;
        }
      })
    );

    return Result.ok(
      {
        data: enrichedResponse,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
      'Restaurants retrieved successfully',
    );
  }

  async getRestaurantById(id: string): Promise<Result<IRestaurantResponseDTO>> {
    const result = await this.restaurantRepository.findOne({ where: { id } });
    if (!result.isSuccess) {
      throwApplicationError(HttpStatus.NOT_FOUND, 'Restaurant not found');
    }
    const restaurantId: string = result.getValue().id;
    const restaurantWithDetails: Restaurant = await this.restaurantRepository.getRestaurant(restaurantId);
    const restaurantResponse = RestaurantParser.createRestaurantResponse(restaurantWithDetails);

    // Enrich with subscription usage data
    try {
      const usageDetails = await this.subscriptionService.getRestaurantSubscriptionUsage(restaurantId);
      if (restaurantResponse.subscription) {
        const plan = await this.planRepository.findOne({ where: { id: restaurantResponse.subscription.planId } });

        restaurantResponse.subscription.completedOrders = usageDetails.usage.completedOrders;
        restaurantResponse.subscription.overageCount = usageDetails.usage.overageCount;
        restaurantResponse.subscription.isOverLimit = usageDetails.usage.isOverLimit;
        restaurantResponse.subscription.additionalCharges = (usageDetails.usage.overageCount || 0) * parseFloat(plan.overageChargePerInvoice);
      }
    } catch (error) {
      this.logger.error(`Error fetching subscription usage for restaurant ${restaurantId}: ${error.message}`);
    }

    return Result.ok(
      restaurantResponse,
      'Restaurant retrieved successfully',
    );
  }

  async toggleRestaurantStatus(id: string): Promise<Result<{ message: string }>> {
    const restaurantResult = await this.restaurantRepository.findOne({ where: { id } });
    if (!restaurantResult.isSuccess) {
      throwApplicationError(HttpStatus.NOT_FOUND, 'Restaurant is not available');
    }

    const restaurant = restaurantResult.getValue();
    const updateResult = await this.restaurantRepository.updateOne(
      { id },
      { isActive: !restaurant.isActive } as any,
    );

    if (!updateResult.isSuccess) {
      throwApplicationError(HttpStatus.INTERNAL_SERVER_ERROR, 'Unable to toggle restaurant status');
    }

    return Result.ok({ message: 'Restaurant status changed successfully.' }, 'Restaurant status toggled successfully');
  }

  async getWalletBalance(restaurantId: string): Promise<Result<UpdateRestaurantWalletDto>> {
    const result = await this.restaurantRepository.findOne({ where: { id: restaurantId } });
    if (!result.isSuccess) {
      throwApplicationError(HttpStatus.NOT_FOUND, 'Restaurant not found');
    }
    const restaurant = result.getValue();
    const dto = {
      restaurantId: restaurant.id,
      totalBalance: restaurant.walletBalance || 0,
      walletTotalEarned: restaurant.walletTotalEarned || 0,
      walletTotalWithdrawn: restaurant.walletTotalWithdrawn || 0,
    };
    return Result.ok(dto);
  }

  private async assignTrialSubscription(restaurantId: string): Promise<void> {
    try {
      const plan = await this.subscriptionService.getPlanByCode('trial');
      if (!plan) {
        this.logger.warn("Trial subscription plan with code 'trial' was not found.");
        return;
      }
      const subscription = await this.subscriptionService.assignRestaurantToPlan({
        restaurantId,
        planId: plan.id,
        isAutoRenew: true,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to assign trial subscription plan to restaurant ${restaurantId}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}