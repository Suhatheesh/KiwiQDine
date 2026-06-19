import { Audit } from './../domain/audit/audit';
export interface ICategory {
  name: string;
  code: string;
  description?: string;
  image?: string;
  imageKey?: string;
  restaurantId: string;
  displayOrder?: number;
  isShowcase?: boolean;
  isActive?: boolean;
  audit: Audit;
}
