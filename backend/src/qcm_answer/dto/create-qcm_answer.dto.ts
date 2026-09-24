import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateQcmAnswerDto {
  @IsString()
  answer: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsNumber()
  @IsOptional()
  qcmId?: number;
}
