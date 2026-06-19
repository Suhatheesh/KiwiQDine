import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum SingleClientStatus {
  onBoarding = 'onBoarding',
  active = 'active',
  inactive = 'inactive',
}

@Entity('singleclients')
@Index(['email'], { unique: true })
export class SingleClient extends BaseEntity {
  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  organisationName: string;

  @Column({ nullable: true })
  organisationAddress: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @Column({ default: false })
  isActive: boolean;

  @Column({ type: 'enum', enum: SingleClientStatus, default: SingleClientStatus.onBoarding })
  status: SingleClientStatus;

  @Column({ nullable: true })
  refreshTokenHash: string;
}
