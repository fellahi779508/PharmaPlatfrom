import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateYearDto {
  @IsString()
  name: string;
  @IsBoolean()
  @IsOptional()
  isDemo: boolean;
}
