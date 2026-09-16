import { PartialType } from '@nestjs/mapped-types';
import { CreateSessionQuestionDto } from './create-session-question.dto';

export class UpdateSessionQuestionDto extends PartialType(CreateSessionQuestionDto) {}
