import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/auth/enums/role.enum';
import { Todo } from 'src/todo/entities/todo.entity';
import { RedeemCode } from 'src/redeem_code/entities/redeem_code.entity';
import { Session } from 'src/session/entities/session.entity';
import { Exam } from 'src/exam/entities/exam.entity';
@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ default: '', type: 'varchar' })
  firstName: string;
  @Column({ default: '', type: 'varchar' })
  lastName: string;
  @Column({ type: 'varchar' })
  username: string;
  @Column({ default: '', type: 'varchar' })
  phone: string;
  @Column({ type: 'varchar' })
  email: string;
  @Column({ type: 'varchar' })
  password: string;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @Column({ default: false, type: 'boolean' })
  isActive: boolean;
  @Column({ nullable: true, type: 'date' })
  activationDate?: Date;
  @Column({ nullable: true, type: 'date' })
  endDate?: Date;
  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: string;
  @Column({ default: false, type: 'boolean' })
  isVerified: boolean;
  @Column({ type: 'varchar', length: 6, nullable: true })
  otpCode: string | null;

  @Column({ default: 0, type: 'integer' })
  aiGenerationCount: number;

  @Column({ type: 'timestamp', nullable: true })
  otpExpiresAt: Date | null;

  @Column({ nullable: true })
  currentJti: string;

  @OneToMany(() => Todo, (todo) => todo.user, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  todos: Todo[] | null;


  @OneToOne(() => RedeemCode, (redeemCode) => redeemCode.user, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'redeemCodeId' })
  redeemCode: RedeemCode | null;

  @OneToMany(() => Session, (session) => session.user, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  sessions: Session[] | null;

  @OneToMany(() => Exam, (exam) => exam.user)
  exams: Exam[] | null;

  //triggers-
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
