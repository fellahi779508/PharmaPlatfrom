import { PartialType } from '@nestjs/mapped-types';
import { CreateSessionQuestionAnswerDto } from './create-session-question-answer.dto';

export class UpdateSessionQuestionAnswerDto extends PartialType(CreateSessionQuestionAnswerDto) {}
