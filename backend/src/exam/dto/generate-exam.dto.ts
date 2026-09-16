import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GenerateExamDto {
    @Type(() => Number)
    @IsInt()
    subjectId: number;

    @Type(() => Number)
    @IsInt()
    semesterId: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    questionCount?: number = 20;

    /** Duration in minutes: 45, 60, or 90. */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(5)
    @Max(300)
    durationMinutes?: number = 60;
}