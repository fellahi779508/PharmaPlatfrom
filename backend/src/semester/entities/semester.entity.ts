import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Year } from 'src/year/entities/year.entity';
import { Course } from 'src/course/entities/course.entity';
import { Exam } from 'src/exam/entities/exam.entity';

@Entity('semester')
export class Semester {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  number: number;
  @ManyToOne(() => Year, (year) => year.semesters, { onDelete: 'CASCADE' })
  year: Year;
  @OneToMany(() => Course, (course) => course.semester)
  courses: Course[];
  @OneToMany(() => Exam, (exam) => exam.semester)
  exams: Exam[];
}
