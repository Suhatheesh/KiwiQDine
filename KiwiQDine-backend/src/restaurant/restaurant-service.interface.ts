import { Result } from './../domain/result/result';
import { CreateRestaurantDTO } from './create-restaurant.dto';
import { IRestaurantResponseDTO } from './restaurant-response.dto';
import { EnhancedPaginationDto, PaginationResponse } from '../shared/dto/enhanced-pagination.dto';
import { UpdateRestaurantWalletDto } from '@/customer-portal/dto/update-restaurant-wallet.dto';

export interface IRestaurantService {
  createRestaurant(createRestaurantDTO: CreateRestaurantDTO): Promise<Result<IRestaurantResponseDTO>>;

  getRestaurants(): Promise<Result<IRestaurantResponseDTO[]>>;

  getRestaurantsWithFilters(filters: EnhancedPaginationDto): Promise<Result<PaginationResponse<IRestaurantResponseDTO>>>;

  getRestaurantById(id: string): Promise<Result<IRestaurantResponseDTO>>;

  toggleRestaurantStatus(id: string): Promise<Result<{ message: string }>>;

  getWalletBalance(restaurantId: string): Promise<Result<UpdateRestaurantWalletDto>>;

  updateRestaurant(id: string, updateRestaurantDTO: any): Promise<Result<IRestaurantResponseDTO>>;
}
