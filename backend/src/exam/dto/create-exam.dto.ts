import { IsNumber } from 'class-validator';

export class CreateExamDto {
  @IsNumber()
  duration: number;
}
