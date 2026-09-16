import { Qcm } from 'src/qcm/entities/qcm.entity';
import { QcmAnswer } from 'src/qcm_answer/entities/qcm_answer.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { ExamSession } from './examSession.entity';

@Entity('exam_session_answer')
export class ExamSessionAnswer {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => ExamSession, (s) => s.answers, { onDelete: 'CASCADE' })
    session: ExamSession;

    @ManyToOne(() => Qcm, { onDelete: 'CASCADE', eager: true })
    qcm: Qcm;

    @ManyToOne(() => QcmAnswer, { nullable: true, onDelete: 'SET NULL', eager: true })
    selectedAnswer: QcmAnswer | null;

    @Column({ nullable: true })
    isCorrect: boolean;

    @Column({ default: false })
    isSkipped: boolean;

    @Column({ type: 'int', default: 0 })
    timeSpent: number;

    @CreateDateColumn()
    answeredAt: Date;
}