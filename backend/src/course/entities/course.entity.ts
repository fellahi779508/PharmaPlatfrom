import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Subject } from 'src/subject/entities/subject.entity';
import { Qcm } from 'src/qcm/entities/qcm.entity';
import { Semester } from 'src/semester/entities/semester.entity';

@Entity('course')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @ManyToOne(() => Subject, (subject) => subject.courses, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  subject: Subject;
  @OneToMany(() => Qcm, (qcm) => qcm.course, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  qcms: Qcm[];
  @ManyToOne(() => Semester, (semester) => semester.courses, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  semester: Semester;
}
