import { OrderNote } from '../order_notes/order_note';
import { OrderNoteParser } from '../order_notes/order_note_parser';
import { OrderStatusParser } from '../order_statuses/order_status_parser';
import { AuditParser } from './../audit/audit.parser';
import { Order } from './order';
import { IOrderResponseDTO } from './order-response.dto';

export class OrderParser {
  static createOrderResponse(order: Order, notes?: OrderNote[]): IOrderResponseDTO {
    return {
      id: order.id,
      state: OrderStatusParser.createResponse(order.state),
      type: order.type,
      singleclientId: order.singleclientId,
      customerId: order.customerId,
      subtotal: order.subtotal || order.total, // Fallback for old orders
      serviceCharge: order.serviceCharge || 0,
      tax: order.tax || 0,
      total: order.total,
      discount: order.discount,
      orderManagerId: order.orderManagerId,
      notes: notes ? OrderNoteParser.createOrderNotesResponse(notes) : [],
      ...AuditParser.createAuditResponse(order.audit),
    };
  }

  static createOrdersResponse(orders: Order[]): IOrderResponseDTO[] {
    return orders.map((order) => this.createOrderResponse(order));
  }
}
