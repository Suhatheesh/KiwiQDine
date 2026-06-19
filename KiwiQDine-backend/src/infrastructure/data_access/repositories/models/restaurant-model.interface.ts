
import { Location as LocationEntity } from '../../../database/entities/location.entity';

export interface IRestaurantdata {
  readonly name: string;
  readonly email: string;
  readonly isActive: boolean;
  readonly webUrl?: string;
  readonly logoUrl?: string;
  readonly timeZone?: string;
  readonly phoneNumber: string;
  readonly singleclientId: string;
  readonly location: LocationEntity;
  readonly opened: boolean;
  readonly imageUrl: string;
}
