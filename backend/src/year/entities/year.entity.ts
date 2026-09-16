import { RedeemCode } from 'src/redeem_code/entities/redeem_code.entity';
import { Semester } from 'src/semester/entities/semester.entity';
import { Subject } from 'src/subject/entities/subject.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('year')
export class Year {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @OneToMany(() => Semester, (semester) => semester.year)
  semesters: Semester[];
  @OneToMany(() => Subject, (subject) => subject.year)
  subjects: Subject[];

  @OneToMany(() => RedeemCode, (redeemCode) => redeemCode.year)
  redeemCodes: RedeemCode[];
}
