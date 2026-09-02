import { Semester } from 'src/semester/entities/semester.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('year')
export class Year {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  number: number;
  @OneToMany(() => Semester, (semester) => semester.year)
  semesters: Semester[];
}
