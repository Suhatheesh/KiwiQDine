import { Audit } from './../domain/audit/audit';
export interface IAddon {
  name: string;
  description?: string;
  image?: string;
  quantity: number;
  audit: Audit;
  unitPrice: number;
  restaurantId: string;
}
