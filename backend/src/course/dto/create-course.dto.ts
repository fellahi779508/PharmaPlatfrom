import { IsNumber, IsString } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  name: string;
  @IsNumber()
  subjectId: number;
  @IsNumber()
  semesterId: number;
}
