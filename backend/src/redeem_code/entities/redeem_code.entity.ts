import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('redeem_code')
export class RedeemCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;
}
