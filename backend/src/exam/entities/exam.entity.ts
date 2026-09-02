import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('exam')
export class Exam {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  duration: number;
}
