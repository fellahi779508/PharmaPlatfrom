import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from 'src/user/entities/user.entity';
import { SessionQuestion } from 'src/session-question/entities/session-question.entity';

export enum SessionStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity('session')
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.NOT_STARTED,
  })
  status: SessionStatus;

  // 👇 explicit type + nullable
  @Column({ type: 'int', nullable: true })
  currentQuestionId: number | null;

  @Column({ type: 'int', default: 0 })
  totalQuestions: number;

  @Column({ type: 'int', default: 0 })
  correctCount: number;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => SessionQuestion, (sq) => sq.session, { cascade: true })
  questions: SessionQuestion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
