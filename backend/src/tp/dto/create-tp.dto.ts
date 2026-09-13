import { IsNumber, IsString } from 'class-validator';

export class CreateTpDto {
  @IsString()
  name: string;

  @IsNumber()
  subjectId: number;
}
