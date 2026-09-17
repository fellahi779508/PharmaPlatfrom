import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, Min } from 'class-validator';

export class SubmitAnswerDto {
    @Type(() => Number)
    @IsInt()
    qcmId: number;

    /** Zero or more answer IDs. Empty array (or omitted) = skip. */
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Type(() => Number)
    selectedAnswerIds?: number[];

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    timeSpent?: number;
}