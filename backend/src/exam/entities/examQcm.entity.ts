import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Exam } from './exam.entity';
import { Qcm } from 'src/qcm/entities/qcm.entity';

@Entity('exam_qcm')
export class ExamQcm {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Exam, (exam) => exam.examQcms, { onDelete: 'CASCADE' })
    exam: Exam;

    @ManyToOne(() => Qcm, { onDelete: 'CASCADE', eager: true })
    qcm: Qcm;

    @Column()
    order: number;
}