import { auditMockData } from '../audit/audit-mock-data';
import { Audit } from '../domain';
import { IAddon } from './addon-entity.interface';

export const addonMockData: IAddon = {
  name: 'Extra Cheese',
  quantity: 100,
  audit: Audit.create(auditMockData).getValue(),
  restaurantId: 'mock-restaurant-id',
  unitPrice: 50,
};
