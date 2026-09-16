import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Exam } from './exam.entity';
import { User } from 'src/user/entities/user.entity';
import { ExamSessionAnswer } from './examSessionAnswer';

export enum ExamSessionStatus {
    IN_PROGRESS = 'in_progress',
    PAUSED = 'paused',
    COMPLETED = 'completed',
}

@Entity('exam_session')
export class ExamSession {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Exam, (exam) => exam.sessions, { onDelete: 'CASCADE' })
    exam: Exam;
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'uuid' })
    userId: string;

    @Column({
        type: 'enum',
        enum: ExamSessionStatus,
        default: ExamSessionStatus.IN_PROGRESS,
    })
    status: ExamSessionStatus;

    @Column({ default: 0 })
    currentQuestionIndex: number;

    @Column({ default: 0 })
    score: number;

    @Column({ type: 'int', default: 0 })
    totalTimeSpent: number; // seconds

    @Column({ type: 'timestamp', nullable: true })
    startedAt: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    lastActiveAt: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    pausedAt: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    completedAt: Date | null;

    @OneToMany(() => ExamSessionAnswer, (a) => a.session, { cascade: true })
    answers: ExamSessionAnswer[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}