
import { IAudit } from '../../infrastructure/database/mongoDB/base-document.interface';

export interface IOrderNoteResponseDTO extends IAudit {
  id: string;
  note: string;
  orderId: string;
}
