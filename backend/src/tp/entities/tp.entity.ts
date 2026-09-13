import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Subject } from 'src/subject/entities/subject.entity';
import { Qcm } from 'src/qcm/entities/qcm.entity';

@Entity('tp')
export class Tp {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @ManyToOne(() => Subject, (subject) => subject.tps, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  subject: Subject;
  @OneToMany(() => Qcm, (qcm) => qcm.tp, { nullable: true })
  qcms: Qcm[];
}
