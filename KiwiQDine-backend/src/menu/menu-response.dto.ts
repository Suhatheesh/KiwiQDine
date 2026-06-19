
import { IRestaurantResponseDTO } from 'src/restaurant';
import { ICategoryResponseDTO } from './../category/category-response.dto';
import { IAudit } from './../infrastructure/database/mongoDB/base-document.interface';
import { ITemResponseDTO } from './../item/item-response.dto';
export interface IMenuResponseDTO extends IAudit {
  id: string;
  name: string;
  description?: string;
  discount: number;
  imageUrl: string;
  basePrice: number;
  restaurantId: string;
  category: ICategoryResponseDTO;
  items?: ITemResponseDTO[];
  restaurant?: IRestaurantResponseDTO;
}
