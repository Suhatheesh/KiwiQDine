import { Entity } from '../domain/entity/';
import { Audit } from './../domain/audit/audit';
import { Result } from './../domain/result';
import { Location } from './../location/location';
import { Menu } from './../menu/menu';
import { IRestaurant, PaymentMethod } from './restaurant.interface';

export class Restaurant extends Entity<IRestaurant> {
  private _name: string;
  private _email: string;
  private _isActive: boolean;
  private _webUrl?: string;
  private _logoUrl?: string;
  private _timeZone?: string;
  private _location: Location;
  private _audit: Audit;
  private _phoneNumber: string;
  private _opened: boolean;
  private _imageUrl: string;
  private _paymentMethod: PaymentMethod[];
  private _openingHour: number;
  private _closingHour: number;
  private _menus: Menu[];
  private _walletBalance?: number;
  private _walletTotalEarned?: number;
  private _walletTotalWithdrawn?: number;
  private _primaryColor?: string;
  private _secondaryColor?: string;
  private _tertiaryColor?: string;
  private _requireWaiterConfirmation?: boolean;
  private _gracePeriodStartDate?: string | null;
  private _gracePeriodEndDate?: string | null;
  constructor(id: string, props: IRestaurant) {
    super(id);
    this._name = props.name;
    this._email = props.email;
    this._isActive = props.isActive;
    this._webUrl = props.webUrl;
    this._logoUrl = props.logoUrl;
    this._timeZone = props.timeZone;
    this._location = props.location;
    this._audit = props.audit;
    this._phoneNumber = props.phoneNumber;
    this._opened = props.opened;
    this._imageUrl = props.imageUrl;
    this._paymentMethod = props.paymentMethod;
    this._openingHour = props.openingHour;
    this._closingHour = props.closingHour;
    this._menus = props.menus;
    this._walletBalance = props.walletBalance;
    this._walletTotalEarned = props.walletTotalEarned;
    this._walletTotalWithdrawn = props.walletTotalWithdrawn;
    this._primaryColor = props.primaryColor;
    this._secondaryColor = props.secondaryColor;
    this._tertiaryColor = props.tertiaryColor;
    this._requireWaiterConfirmation = props.requireWaiterConfirmation;
    this._gracePeriodStartDate = props.gracePeriodStartDate;
    this._gracePeriodEndDate = props.gracePeriodEndDate;
  }

  get name(): string {
    return this._name;
  }

  set name(name: string) {
    this._name = name;
  }

  get email(): string {
    return this._email;
  }

  set email(email: string) {
    this._email = email;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  set isActive(isActive: boolean) {
    this._isActive = isActive;
  }

  get webUrl(): string | undefined {
    return this._webUrl;
  }

  set webUrl(webUrl: string | undefined) {
    this._webUrl = webUrl;
  }

  get logoUrl(): string | undefined {
    return this._logoUrl;
  }

  set logoUrl(logoUrl: string | undefined) {
    this._logoUrl = logoUrl;
  }

  get timeZone(): string | undefined {
    return this._timeZone;
  }

  set timeZone(timeZone: string | undefined) {
    this._timeZone = timeZone;
  }

  get phoneNumber(): string {
    return this._phoneNumber;
  }

  set phoneNumber(phoneNumber: string) {
    this._phoneNumber = phoneNumber;
  }

  get location(): Location {
    return this._location;
  }

  set location(location: Location) {
    this._location = location;
  }

  get audit(): Audit {
    return this._audit;
  }

  set audit(audit) {
    this._audit = audit;
  }

  get opened(): boolean {
    return this._opened;
  }

  set opened(opened: boolean) {
    this._opened = opened;
  }

  get imageUrl(): string {
    return this._imageUrl;
  }

  set imageUrl(imageUrl: string) {
    this._imageUrl = imageUrl;
  }

  get paymentMethod(): PaymentMethod[] {
    return this._paymentMethod;
  }

  set PaymentMethod(paymentMethods: PaymentMethod[]) {
    this._paymentMethod = paymentMethods;
  }

  get openingHour(): number {
    return this._openingHour;
  }

  set openingHour(openingHour: number) {
    this._openingHour = openingHour;
  }

  get closingHour(): number {
    return this._closingHour;
  }

  set closingHour(closingHour: number) {
    this._closingHour = closingHour;
  }

  get menus(): Menu[] {
    return this._menus;
  }

  set menus(menus: Menu[]) {
    this._menus = menus;
  }

  get walletBalance(): number | undefined {
    return this._walletBalance;
  }

  set walletBalance(balance: number | undefined) {
    this._walletBalance = balance;
  }

  get walletTotalEarned(): number | undefined {
    return this._walletTotalEarned;
  }

  set walletTotalEarned(totalEarned: number | undefined) {
    this._walletTotalEarned = totalEarned;
  }

  get walletTotalWithdrawn(): number | undefined {
    return this._walletTotalWithdrawn;
  }

  set walletTotalWithdrawn(totalWithdrawn: number | undefined) {
    this._walletTotalWithdrawn = totalWithdrawn;
  }

  get primaryColor(): string | undefined {
    return this._primaryColor;
  }

  set primaryColor(color: string | undefined) {
    this._primaryColor = color;
  }

  get secondaryColor(): string | undefined {
    return this._secondaryColor;
  }

  set secondaryColor(color: string | undefined) {
    this._secondaryColor = color;
  }

  get tertiaryColor(): string | undefined {
    return this._tertiaryColor;
  }

  set tertiaryColor(color: string | undefined) {
    this._tertiaryColor = color;
  }

  get requireWaiterConfirmation(): boolean | undefined {
    return this._requireWaiterConfirmation;
  }

  set requireWaiterConfirmation(value: boolean | undefined) {
    this._requireWaiterConfirmation = value;
  }

  get gracePeriodStartDate(): string | null | undefined {
    return this._gracePeriodStartDate;
  }

  set gracePeriodStartDate(value: string | null | undefined) {
    this._gracePeriodStartDate = value;
  }

  get gracePeriodEndDate(): string | null | undefined {
    return this._gracePeriodEndDate;
  }

  set gracePeriodEndDate(value: string | null | undefined) {
    this._gracePeriodEndDate = value;
  }

  static create(props: IRestaurant, id?: string): Result<Restaurant> {
    return Result.ok(new Restaurant(id, props));
  }
}
