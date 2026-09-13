import { IsNumber, IsString } from 'class-validator';

export class CreateTdDto {
  @IsString()
  name: string;

  @IsNumber()
  subjectId: number;
}
