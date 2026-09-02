import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Year } from 'src/year/entities/year.entity';
import { Subject } from 'src/subject/entities/subject.entity';

@Entity('semester')
export class Semester {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  number: number;
  @ManyToOne(() => Year, (year) => year.semesters)
  year: Year;
  @OneToMany(() => Subject, (subject) => subject.semester)
  subjects: Subject[];
}
