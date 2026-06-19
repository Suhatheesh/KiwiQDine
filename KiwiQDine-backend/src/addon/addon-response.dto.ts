import { IMenuResponseDTO } from '../menu/menu-response.dto';

import { IAudit } from './../infrastructure/database/mongoDB/base-document.interface';
export interface IAddonResponseDTO extends IAudit {
  id: string;
  name: string;
  quantity: number;
  menus: IMenuResponseDTO[];
  unitPrice: number;
  description: string | undefined;
  image?: string;
  restaurantId: string;
}
