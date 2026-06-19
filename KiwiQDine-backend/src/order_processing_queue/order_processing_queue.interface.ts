
import { Audit } from 'src/domain';

export interface IOrderProcessingQueue {
  orderId: string;
  orderStatusId: string;
  audit: Audit;
}
