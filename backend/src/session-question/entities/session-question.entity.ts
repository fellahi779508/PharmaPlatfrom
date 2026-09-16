import { Qcm } from 'src/qcm/entities/qcm.entity';
import { SessionQuestionAnswer } from 'src/session-question-answer/entities/session-question-answer.entity';
import { Session } from 'src/session/entities/session.entity';
import {
  Entity,
  Unique,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  OneToMany,
} from 'typeorm';

@Entity('session_question')
@Unique(['session', 'qcm'])
export class SessionQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Session, (session) => session.questions, {
    onDelete: 'CASCADE',
  })
  session: Session;

  @ManyToOne(() => Qcm, (qcm) => qcm.sessionQuestions, { onDelete: 'CASCADE' })
  qcm: Qcm;

  @Column()
  position: number;

  @Column({ default: false })
  isAnswered: boolean;

  @Column({ default: false })
  isRevealed: boolean;

  @Column({ nullable: true })
  isCorrect: boolean;

  @Column({ nullable: true })
  answeredAt: Date;

  @OneToMany(() => SessionQuestionAnswer, (a) => a.sessionQuestion, {
    cascade: true,
  })
  selectedAnswers: SessionQuestionAnswer[];

  // optional: save selected answers before reveal
  @Column('json', { nullable: true })
  draftAnswerIds: number[] | null;
}
