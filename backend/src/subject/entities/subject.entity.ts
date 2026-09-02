import { Course } from 'src/course/entities/course.entity';
import { Semester } from 'src/semester/entities/semester.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('subject')
export class Subject {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @CreateDateColumn()
  createdAt: Date;
  @CreateDateColumn()
  updatedAt: Date;
  @ManyToOne(() => Semester, (semester) => semester.subjects)
  semester: Semester;
  @OneToMany(() => Course, (course) => course.subject)
  courses: Course[];
}
