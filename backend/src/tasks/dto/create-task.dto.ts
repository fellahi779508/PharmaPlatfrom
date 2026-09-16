import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  todoId: number;

  @IsBoolean()
  @IsOptional()
  isFinished?: boolean;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsOptional()
  startDate?: Date;

  @IsOptional()
  startTime?: Date;
}
