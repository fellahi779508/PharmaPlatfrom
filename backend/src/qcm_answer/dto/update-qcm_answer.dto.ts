import { PartialType } from '@nestjs/mapped-types';
import { CreateQcmAnswerDto } from './create-qcm_answer.dto';

export class UpdateQcmAnswerDto extends PartialType(CreateQcmAnswerDto) {}
