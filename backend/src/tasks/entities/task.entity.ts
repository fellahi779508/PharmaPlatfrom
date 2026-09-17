import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Todo } from 'src/todo/entities/todo.entity';

@Entity('task')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  priority?: string;

  /** Plain YYYY-MM-DD (Postgres `date`). */
  @Column({ type: 'date', nullable: true })
  startDate?: string | null;

  /** Plain HH:mm or HH:mm:ss (Postgres `time`). */
  @Column({ type: 'time', nullable: true })
  startTime?: string | null;

  @Column({ default: false })
  isFinished: boolean;

  @ManyToOne(() => Todo, (todo) => todo.tasks, { onDelete: 'CASCADE' })
  todo: Todo;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}