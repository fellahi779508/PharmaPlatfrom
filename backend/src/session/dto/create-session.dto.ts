import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';

export class CourseSelectionDto {
  @IsInt()
  courseId: number;

  @IsInt()
  @Min(1)
  qcmQte: number;
}
export class TdSelectionDto {
  @IsInt()
  tdId: number;

  @IsInt()
  @Min(1)
  qcmQte: number;
}
export class TpSelectionDto {
  @IsInt()
  tpId: number;

  @IsInt()
  @Min(1)
  qcmQte: number;
}

export class SubjectSelectionDto {
  @IsInt()
  subjectId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseSelectionDto)
  courses: CourseSelectionDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TdSelectionDto)
  tds: TdSelectionDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TpSelectionDto)
  tps: TpSelectionDto[];
}

export class CreateSessionDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubjectSelectionDto)
  subjects: SubjectSelectionDto[];
}
