import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Qcm } from 'src/qcm/entities/qcm.entity';

@Entity('qcm_answer')
export class QcmAnswer {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  answer: string;
  @Column()
  isCorrect: boolean;
  @Column({ type: 'text', nullable: true })
  explanation: string;
  @ManyToOne(() => Qcm, (qcm) => qcm.answers, { onDelete: 'CASCADE' })
  qcm: Qcm;
}
