import { Course } from 'src/course/entities/course.entity';
import { Semester } from 'src/semester/entities/semester.entity';
import { Td } from 'src/td/entities/td.entity';
import { Tp } from 'src/tp/entities/tp.entity';
import { Year } from 'src/year/entities/year.entity';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  BeforeUpdate,
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
  @ManyToOne(() => Year, (year) => year.subjects, { onDelete: 'CASCADE' })
  year: Year;
  @OneToMany(() => Course, (course) => course.subject, { nullable: true })
  courses: Course[];
  @OneToMany(() => Td, (td) => td.subject, { nullable: true })
  tds: Td[];
  @OneToMany(() => Tp, (tp) => tp.subject, { nullable: true })
  tps: Tp[];
  @BeforeInsert()
  beforeInsert() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  beforeUpdate() {
    this.updatedAt = new Date();
  }
}
