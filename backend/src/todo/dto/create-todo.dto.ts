import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateTodoDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}
