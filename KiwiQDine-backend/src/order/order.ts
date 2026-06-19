
import { CartItem } from '../cart/cart-item';
import { Entity, Result } from '../domain';
import { OrderStatus } from '../order_statuses/order_status';
import { Audit } from './../domain/audit/audit';
import { IOrder, dinningType } from './order-entity.interface';

export class Order extends Entity<IOrder> implements IOrder {
  _state: OrderStatus | undefined;
  _type: dinningType;
  _singleclientId: string;
  _orderStatusId: string;
  _customerId?: string;
  _subtotal: number;
  _serviceCharge: number;
  _tax: number;
  _total: number;
  _discount?: number;
  _orderManagerId: string;
  _audit: Audit;
  _cartItems: CartItem[] | undefined;
  _summary: string;

  constructor(
    id: string,
    {
      state,
      type,
      singleclientId,
      customerId,
      subtotal,
      serviceCharge,
      tax,
      total,
      discount,
      orderManagerId,
      audit,
      cartItems,
      orderStatusId,
      summary,
    }: IOrder,
  ) {
    super(id);
    this._state = state;
    this._type = type;
    this._singleclientId = singleclientId;
    this._customerId = customerId;
    this._subtotal = subtotal;
    this._serviceCharge = serviceCharge;
    this._tax = tax;
    this._total = total;
    this._discount = discount;
    this._orderManagerId = orderManagerId;
    this._audit = audit;
    this._cartItems = cartItems;
    this._orderStatusId = orderStatusId;
    this._summary = summary;
  }

  get state(): OrderStatus {
    return this._state;
  }

  set state(state: OrderStatus) {
    this._state = state;
  }

  get summary(): string {
    return this._summary;
  }

  get type(): dinningType {
    return this._type;
  }

  set type(type: dinningType) {
    this._type = type;
  }

  get singleclientId(): string {
    return this._singleclientId;
  }

  set singleclientId(singleclientId: string) {
    this._singleclientId = singleclientId;
  }

  get customerId(): string {
    return this._customerId;
  }

  set customerId(customerId: string) {
    this._customerId = customerId;
  }

  get orderStatusId(): string {
    return this._orderStatusId;
  }

  set orderStatusId(orderStatusId: string) {
    this._orderStatusId = orderStatusId;
  }

  get subtotal(): number {
    return this._subtotal;
  }

  set subtotal(subtotal: number) {
    this._subtotal = subtotal;
  }

  get serviceCharge(): number {
    return this._serviceCharge;
  }

  set serviceCharge(serviceCharge: number) {
    this._serviceCharge = serviceCharge;
  }

  get tax(): number {
    return this._tax;
  }

  set tax(tax: number) {
    this._tax = tax;
  }

  get total(): number {
    return this._total;
  }

  set total(total: number) {
    this._total = total;
  }

  get discount(): number {
    return this._discount;
  }

  set discount(discount: number) {
    this._discount = discount;
  }

  get orderManagerId(): string {
    return this._orderManagerId;
  }

  set orderManagerId(managerId: string) {
    this._orderManagerId = managerId;
  }

  get audit(): Audit {
    return this._audit;
  }

  set audit(audit: Audit) {
    this._audit = audit;
  }

  get cartItems(): CartItem[] | undefined {
    return this._cartItems;
  }

  set cartItems(cartItems: CartItem[] | undefined) {
    this._cartItems = cartItems;
  }

  static create(props: IOrder, id?: string) {
    return Result.ok(new Order(id, props)).getValue();
  }
}
