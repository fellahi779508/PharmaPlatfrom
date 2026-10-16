import { IsEnum, IsInt, IsOptional, IsString, Max, Min, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum RoomMode {
  EXAM_SIMULATION = 'exam_simulation',
  QCM_SPEED_RUN = 'qcm_speed_run',
}

export class ContentSelection {
  @IsInt()
  subjectId: number;

  @IsOptional()
  @IsInt()
  semesterId?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  courseIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tdIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tpIds?: number[];
}

export class CreateRoomDto {
  @IsEnum(RoomMode)
  mode: RoomMode;

  /** Number of QCMs to use in the session (for QCM speed run mode, chosen by the host) */
  @IsInt()
  @Min(1)
  @Max(100)
  qcmCount: number;

  /** Time per question in seconds (for speed run). 0 means no per-question timer */
  @IsInt()
  @Min(0)
  timerSeconds: number;

  /** Content selection - subject and optional courses/TDs/TPs to pull QCMs from */
  @IsObject()
  @ValidateNested()
  @Type(() => ContentSelection)
  content: ContentSelection;
}
