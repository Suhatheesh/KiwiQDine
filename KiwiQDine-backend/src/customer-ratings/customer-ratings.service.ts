import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CustomerRating, Customer, Restaurant, Order } from '../infrastructure/database/entities';
import { CreateCustomerRatingDto } from './dto/create-customer-rating.dto';
import { PaginationDto, PaginationResponse } from '../shared/dto/pagination.dto';

@Injectable()
export class CustomerRatingsService {
  constructor(
    @InjectRepository(CustomerRating)
    private customerRatingRepository: Repository<CustomerRating>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async create(createRatingDto: CreateCustomerRatingDto): Promise<CustomerRating> {
    const { customerId, restaurantId, orderId, rating, comment, metadata } = createRatingDto;

    // Validate customer exists
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Validate restaurant exists
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Validate order exists and belongs to customer and restaurant (if orderId provided)
    if (orderId) {
      const order = await this.orderRepository.findOne({
        where: { id: orderId, customerId, restaurantId },
      });

      if (!order) {
        throw new BadRequestException('Order not found or does not belong to the specified customer and restaurant');
      }
    }

    // Create rating
    const customerRating = this.customerRatingRepository.create({
      customerId,
      restaurantId,
      orderId: orderId || null,
      rating,
      comment: comment || null,
      metadata: metadata || null,
    });

    return await this.customerRatingRepository.save(customerRating);
  }

  async findAll(
    filters?: {
      customerId?: string;
      restaurantId?: string;
      orderId?: string;
      minRating?: number;
      maxRating?: number;
    },
    pagination: PaginationDto = { page: 1, limit: 10 },
  ): Promise<PaginationResponse<CustomerRating>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const whereCondition: any = {};

    if (filters?.customerId) {
      whereCondition.customerId = filters.customerId;
    }

    if (filters?.restaurantId) {
      whereCondition.restaurantId = filters.restaurantId;
    }

    if (filters?.orderId) {
      whereCondition.orderId = filters.orderId;
    }

    const queryBuilder = this.customerRatingRepository
      .createQueryBuilder('rating')
      .leftJoinAndSelect('rating.customer', 'customer')
      .leftJoinAndSelect('rating.restaurant', 'restaurant')
      .leftJoinAndSelect('rating.order', 'order')
      .where(whereCondition);

    if (filters?.minRating !== undefined) {
      queryBuilder.andWhere('rating.rating >= :minRating', { minRating: filters.minRating });
    }

    if (filters?.maxRating !== undefined) {
      queryBuilder.andWhere('rating.rating <= :maxRating', { maxRating: filters.maxRating });
    }

    queryBuilder.orderBy('rating.createdAt', 'DESC').skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<CustomerRating> {
    const rating = await this.customerRatingRepository.findOne({
      where: { id },
      relations: ['customer', 'restaurant', 'order'],
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    return rating;
  }

  async getRestaurantAverageRating(restaurantId: string): Promise<{
    averageRating: number;
    totalRatings: number;
    ratingDistribution: Record<number, number>;
  }> {
    const ratings = await this.customerRatingRepository.find({
      where: { restaurantId },
      select: ['rating'],
    });

    if (ratings.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const totalRatings = ratings.length;
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    const averageRating = sum / totalRatings;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach((rating) => {
      ratingDistribution[rating.rating] = (ratingDistribution[rating.rating] || 0) + 1;
    });

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalRatings,
      ratingDistribution,
    };
  }
}

