
import { IAudit } from '../../infrastructure/database/mongoDB/base-document.interface';

export interface IOrderProcessingQueueResponseDTO extends IAudit {
  id: string;
  orderStatusId: string;
  orderId: string;
}
