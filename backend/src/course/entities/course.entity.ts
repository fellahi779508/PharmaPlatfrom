import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Subject } from 'src/subject/entities/subject.entity';
import { Qcm } from 'src/qcm/entities/qcm.entity';

@Entity('course')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @ManyToOne(() => Subject, (subject) => subject.courses)
  subject: Subject;
  @OneToMany(() => Qcm, (qcm) => qcm.course)
  qcms: Qcm[];
}
