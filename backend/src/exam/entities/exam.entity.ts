import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Subject } from 'src/subject/entities/subject.entity';
import { Semester } from 'src/semester/entities/semester.entity';
import { ExamQcm } from './examQcm.entity';
import { ExamSession } from './examSession.entity';
import { User } from 'src/user/entities/user.entity';

@Entity('exam')
export class Exam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ default: 20 })
  questionCount: number;

  /** Exam duration in minutes (45 / 60 / 90). */
  @Column({ type: 'int', default: 60 })
  durationMinutes: number;

  @ManyToOne(() => Subject, (subject) => subject.exams, { onDelete: 'CASCADE' })
  subject: Subject;

  @ManyToOne(() => Semester, (semester) => semester.exams, { onDelete: 'CASCADE' })
  semester: Semester;

  @OneToMany(() => ExamQcm, (eq) => eq.exam, { cascade: true })
  examQcms: ExamQcm[];

  @OneToMany(() => ExamSession, (s) => s.exam)
  sessions: ExamSession[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.exams, { onDelete: 'CASCADE', nullable: true })
  user: User;
}