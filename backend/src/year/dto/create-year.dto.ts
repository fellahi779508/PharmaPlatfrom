import { IsString } from 'class-validator';

export class CreateYearDto {
  @IsString()
  name: string;
}
