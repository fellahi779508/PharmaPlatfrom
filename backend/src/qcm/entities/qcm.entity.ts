import { Course } from 'src/course/entities/course.entity';
import { QcmAnswer } from 'src/qcm_answer/entities/qcm_answer.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('qcm')
export class Qcm {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  question: string;
  @ManyToOne(() => Course, (course) => course.qcms)
  course: Course;
  @OneToMany(() => QcmAnswer, (answer) => answer.qcm)
  answers: QcmAnswer[];
}
