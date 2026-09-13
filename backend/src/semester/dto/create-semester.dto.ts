import { IsNumber } from 'class-validator';

export class CreateSemesterDto {
  @IsNumber()
  number: number;

  @IsNumber()
  yearId: number;
}
