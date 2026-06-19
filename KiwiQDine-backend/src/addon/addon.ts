
import { Entity } from '../domain';
import { Audit } from './../domain/audit/audit';
import { Result } from './../domain/result/result';
import { IAddon } from './addon-entity.interface';

export class Addon extends Entity<IAddon> implements IAddon {
  private _name: string;
  private _description: string | undefined;
  private _image: string | undefined;
  private _audit: Audit;
  private _quantity: number;
  private _restaurantId: string;
  private _unitPrice: number;

  constructor(id: string, props: IAddon) {
    super(id);
    this._name = props.name;
    this._description = props.description;
    this._image = props.image;
    this._audit = props.audit;
    this._quantity = props.quantity;
    this._restaurantId = props.restaurantId;
    this._unitPrice = props.unitPrice;
  }

  get name(): string {
    return this._name;
  }

  set name(name: string) {
    this._name = name;
  }

  get restaurantId(): string {
    return this._restaurantId;
  }

  set restaurantId(restaurantId: string) {
    this._restaurantId = restaurantId;
  }

  get audit(): Audit {
    return this._audit;
  }

  set audit(audit: Audit) {
    this._audit = audit;
  }

  get description(): string | undefined {
    return this._description;
  }

  set description(description: string) {
    this._description = description;
  }

  get image(): string | undefined {
    return this._image;
  }

  set image(image: string | undefined) {
    this._image = image;
  }

  get quantity(): number {
    return this._quantity;
  }

  set quantity(quantity: number) {
    this._quantity = quantity;
  }

  get unitPrice(): number {
    return this._unitPrice;
  }

  set unitPrice(unitPrice: number) {
    this._unitPrice = unitPrice;
  }

  static update(props: Partial<IAddon>, addon: Addon): Addon {
    if (props.name) addon.name = props.name;
    if (props.description) addon.description = props.description;
    if (props.image) addon.image = props.image;
    if (props.quantity !== undefined) addon.quantity = props.quantity;
    if (props.unitPrice !== undefined) addon.unitPrice = props.unitPrice;
    return addon;
  }

  static create(props: IAddon, id?: string): Addon {
    return Result.ok(new Addon(id, props)).getValue();
  }
}
