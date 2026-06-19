import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('locations')
export class Location extends BaseEntity {
  @Column()
  address: string;

  @Column({ nullable: true })
  address2: string;

  @Column()
  city: string;

  @Column()
  country: string;

  @Column()
  postCode: string;

  @Column()
  state: string;

  @Column({ nullable: true })
  latitude?: string;

  @Column({ nullable: true })
  longitude?: string;
}
