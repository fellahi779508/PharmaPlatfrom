import { Todo } from 'src/todo/entities/todo.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('task')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  priority: string;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  startTime: Date;

  @Column({ default: false })
  isFinished: boolean;

  @ManyToOne(() => Todo, (todo) => todo.tasks, { onDelete: 'CASCADE' })
  todo: Todo;
}
