import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTpDto {
  @IsString()
  name: string;

  @IsNumber()
  subjectId: number;
  @IsBoolean()
  @IsOptional()
  isDemo: boolean;
}
