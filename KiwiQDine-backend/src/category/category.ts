import { Result } from './../domain/result/result';

import { Entity } from '../domain';
import { Audit } from './../domain/audit/audit';
import { ICategory } from './category-entity.interface';

export class Category extends Entity<ICategory> {
  private _name: string;
  private _code: string;
  private _description?: string;
  private _image?: string;
  private _imageKey?: string;
  private _restaurantId: string;
  private _displayOrder: number;
  private _isShowcase: boolean;
  private _isActive: boolean;
  private _audit: Audit;
  constructor(id: string, props: ICategory) {
    super(id);
    this._name = props.name;
    this._code = props.code;
    this._description = props.description;
    this._image = props.image;
    this._imageKey = props.imageKey;
    this._restaurantId = props.restaurantId;
    this._displayOrder = props.displayOrder ?? 0;
    this._isShowcase = props.isShowcase ?? false;
    this._isActive = props.isActive ?? true;
    this._audit = props.audit;
  }

  get name(): string {
    return this._name;
  }

  set name(name: string) {
    this._name = name;
  }

  get code(): string {
    return this._code;
  }

  set code(code: string) {
    this._code = code;
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

  set image(image: string) {
    this._image = image;
  }

  get imageKey(): string | undefined {
    return this._imageKey;
  }

  set imageKey(imageKey: string) {
    this._imageKey = imageKey;
  }

  get restaurantId(): string {
    return this._restaurantId;
  }

  set restaurantId(restaurantId: string) {
    this._restaurantId = restaurantId;
  }

  get displayOrder(): number {
    return this._displayOrder;
  }

  set displayOrder(displayOrder: number) {
    this._displayOrder = displayOrder;
  }

  get isShowcase(): boolean {
    return this._isShowcase;
  }

  set isShowcase(isShowcase: boolean) {
    this._isShowcase = isShowcase;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  set isActive(isActive: boolean) {
    this._isActive = isActive;
  }

  get audit(): Audit {
    return this._audit;
  }

  set audit(audit: Audit) {
    this._audit = audit;
  }

  static create(props: ICategory, id?: string): Result<Category> {
    return Result.ok(new Category(id, props));
  }
}
