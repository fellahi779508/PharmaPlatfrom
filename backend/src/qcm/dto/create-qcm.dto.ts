import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateQcmDto {
  @IsString()
  question: string;

  @IsNumber()
  @IsOptional()
  courseId?: number;
  @IsNumber()
  @IsOptional()
  tdId?: number;
  @IsNumber()
  @IsOptional()
  tpId?: number;
  @IsArray()
  answers: { answer: string; isCorrect: boolean; explanation: string }[];
}
