import { Audit, Entity, Result } from '../../domain';
import { ISelectedCartItem } from './selected-cart-items-entity.interface';


export class SelectedCartItem extends Entity<ISelectedCartItem> implements ISelectedCartItem {
  _cartItemId: string;
  _itemId: string;
  _menuId: string;
  _price: number;
  _quantity: number;
  _audit: Audit;

  constructor(id: string, props: ISelectedCartItem) {
    super(id);
    this._cartItemId = props.cartItemId;
    this._menuId = props.menuId;
    this._price = props.price;
    this._quantity = props.quantity;
    this._itemId = props.itemId;
    this._audit = props.audit;
  }

  get cartItemId(): string {
    return this._cartItemId;
  }

  set cartItemId(id: string) {
    this._cartItemId = id;
  }

  get menuId(): string {
    return this._menuId;
  }

  get itemId(): string {
    return this._itemId;
  }

  set itemId(id: string) {
    this._itemId = id;
  }

  get price(): number {
    return this._price;
  }

  set price(price: number) {
    this._price = price;
  }

  get quantity(): number {
    return this._quantity;
  }

  set quantity(quantity: number) {
    this._quantity = quantity;
  }

  get audit(): Audit {
    return this._audit;
  }

  set audit(audit: Audit) {
    this._audit = audit;
  }

  static create(props: ISelectedCartItem, id?: string) {
    return Result.ok(new SelectedCartItem(id, props)).getValue();
  }
}
