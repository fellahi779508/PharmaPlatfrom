import { User } from 'src/user/entities/user.entity';
import { Year } from 'src/year/entities/year.entity';
import {
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('redeem_code')
export class RedeemCode {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  code: string;
  @Column({ default: false })
  isActivated: boolean;

  @Column({ nullable: true })
  activationDate: Date;

  @Column({ nullable: true })
  expiryDate: Date;

  @ManyToOne(() => Year, (year) => year.redeemCodes)
  year: Year;

  @OneToOne(() => User, (user) => user.redeemCode, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;


}
