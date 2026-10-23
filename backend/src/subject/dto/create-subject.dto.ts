import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  name: string;
  @IsNumber()
  yearId: number;
  @IsBoolean()
  @IsOptional()
  isDemo: boolean;
}
