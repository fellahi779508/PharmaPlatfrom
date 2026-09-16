import { QcmAnswer } from 'src/qcm_answer/entities/qcm_answer.entity';
import { SessionQuestion } from 'src/session-question/entities/session-question.entity';
import { Entity, Unique, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity('session_question_answer')
@Unique(['sessionQuestion', 'qcmAnswer'])
export class SessionQuestionAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SessionQuestion, (sq) => sq.selectedAnswers, {
    onDelete: 'CASCADE',
  })
  sessionQuestion: SessionQuestion;

  @ManyToOne(() => QcmAnswer, { onDelete: 'CASCADE' })
  qcmAnswer: QcmAnswer;
}
