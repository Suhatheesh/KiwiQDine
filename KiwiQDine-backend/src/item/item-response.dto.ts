// Removed mongoose import - using string IDs now
import { IAudit } from '../infrastructure/database/mongoDB/base-document.interface';
export interface ITemResponseDTO extends IAudit {
  id: string;
  name: string;
  description?: string;
  price: number;
  maximumPermitted: number;
  preparationTime?: number;
}
