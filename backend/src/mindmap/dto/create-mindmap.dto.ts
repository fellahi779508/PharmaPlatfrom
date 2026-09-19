import { IsObject, IsNumber, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMindmapDto {
    @IsString()
    name: string;

    @IsObject()
    jsonContent: Record<string, any>;   // or a typed interface

    @Type(() => Number)
    @IsNumber()
    summaryId: number;
}