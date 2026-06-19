
import { Audit, Entity, Result } from '../domain';
import { IITem } from './item.entity.interface';

export class Item extends Entity<IITem> implements IITem {
  private _name: string;
  private _description: string;
  private _price: number;
  private _maximumPermitted: number;
  private _preparationTime?: number;
  private _audit: Audit;

  constructor(id: string, props: IITem) {
    super(id);
    this._name = props.name;
    this._description = props.description;
    this._price = props.price;
    this._maximumPermitted = props.maximumPermitted;
    this._preparationTime = props.preparationTime;
    this._audit = props.audit;
  }

  get name(): string {
    return this._name;
  }

  set name(name: string) {
    this._name = name;
  }

  get description(): string {
    return this._description;
  }

  set description(description: string) {
    this._description = description;
  }

  get price(): number {
    return this._price;
  }

  set price(price: number) {
    this._price = price;
  }

  get maximumPermitted(): number | undefined {
    return this._maximumPermitted;
  }

  set maximumPermitted(maximumPermitted: number) {
    this._maximumPermitted = maximumPermitted;
  }

  get preparationTime(): number | undefined {
    return this._preparationTime;
  }

  set preparationTime(preparationTime: number | undefined) {
    this._preparationTime = preparationTime;
  }

  get audit(): Audit {
    return this._audit;
  }

  set audit(audit: Audit) {
    this._audit = audit;
  }

  static create(props: IITem, id?: string): Result<Item> {
    return Result.ok(new Item(id || '', props));
  }
}
