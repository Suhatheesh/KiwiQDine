import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { SingleClient } from './singleclient.entity';

export enum RoleEnum {
  ADMIN = 1,
  MANAGER = 2,
  STAFF = 3,
}

@Entity('order_managers')
@Index(['email'], { unique: true })
export class OrderManager extends BaseEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'uuid' })
  singleclientId: string;

  @ManyToOne(() => SingleClient)
  @JoinColumn({ name: 'singleclientId' })
  singleclient: SingleClient;

  @Column({ type: 'enum', enum: RoleEnum, default: RoleEnum.ADMIN })
  role: RoleEnum;

  @Column()
  password: string;
}
