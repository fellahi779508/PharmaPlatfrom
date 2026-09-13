import { Course } from 'src/course/entities/course.entity';
import { QcmAnswer } from 'src/qcm_answer/entities/qcm_answer.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Td } from 'src/td/entities/td.entity';
import { Tp } from 'src/tp/entities/tp.entity';

@Entity('qcm')
export class Qcm {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  question: string;
  @ManyToOne(() => Course, (course) => course.qcms, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  course: Course;
  @ManyToOne(() => Td, (td) => td.qcms, { nullable: true, onDelete: 'CASCADE' })
  td: Td;
  @ManyToOne(() => Tp, (tp) => tp.qcms, { nullable: true, onDelete: 'CASCADE' })
  tp: Tp;
  @OneToMany(() => QcmAnswer, (answer) => answer.qcm, { nullable: true })
  answers: QcmAnswer[];
}
