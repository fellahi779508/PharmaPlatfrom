import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { ExamSession } from './examSession.entity';
import { Qcm } from 'src/qcm/entities/qcm.entity';
import { QcmAnswer } from 'src/qcm_answer/entities/qcm_answer.entity';

@Entity('exam_session_answer')
export class ExamSessionAnswer {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => ExamSession, (s) => s.answers, { onDelete: 'CASCADE' })
    session: ExamSession;

    @ManyToOne(() => Qcm, { onDelete: 'CASCADE', eager: true })
    qcm: Qcm;

    /** All answers the user selected for this question. Empty = skipped. */
    @ManyToMany(() => QcmAnswer, { eager: true })
    @JoinTable({ name: 'exam_session_answer_selected' })
    selectedAnswers: QcmAnswer[];

    @Column({ nullable: true })
    isCorrect: boolean;

    @Column({ default: false })
    isSkipped: boolean;

    @Column({ type: 'int', default: 0 })
    timeSpent: number;

    @CreateDateColumn()
    answeredAt: Date;
}