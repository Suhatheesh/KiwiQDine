import { SingleClient as SingleClientEntity } from '../../../database/entities/singleclient.entity';

export interface IOrderManagerDataModel {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phoneNumber?: string;
  readonly singleclient: SingleClientEntity;
  readonly role: number;
}
