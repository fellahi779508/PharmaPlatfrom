import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMedicamentDto {
    @IsString()
    @MaxLength(255)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    dci?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    therapeuticClass?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    form?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    dosage?: string;

    @IsOptional()
    @IsString()
    indication?: string;

    @IsOptional()
    @IsString()
    contraindications?: string;

    @IsOptional()
    @IsString()
    sideEffects?: string;

    @IsOptional()
    @IsString()
    posology?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}