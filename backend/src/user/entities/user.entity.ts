import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/auth/enums/role.enum';
@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  username: string;
  @Column()
  email: string;
  @Column()
  password: string;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @Column({ default: false })
  isActive: boolean;
  @Column({ nullable: true })
  activationDate: Date;
  @Column({ nullable: true })
  endDate: Date;
  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: string;
  @Column({ default: false })
  isVerified: boolean;
  @Column({ type: 'varchar', length: 6, nullable: true })
  otpCode: string | null;

  @Column({ type: 'timestamp', nullable: true })
  otpExpiresAt: Date | null;

  //triggers
  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
  setDate() {
    this.createdAt = new Date();
  }
  @BeforeUpdate()
  updateDate() {
    this.updatedAt = new Date();
  }
}
