import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Subject } from 'src/subject/entities/subject.entity';
import { Qcm } from 'src/qcm/entities/qcm.entity';

@Entity('td')
export class Td {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @ManyToOne(() => Subject, (subject) => subject.tds, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  subject: Subject;
  @OneToMany(() => Qcm, (qcm) => qcm.td, { nullable: true })
  qcms: Qcm[];
}
