import { PartialType } from '@nestjs/mapped-types';
import { CreateTdDto } from './create-td.dto';

export class UpdateTdDto extends PartialType(CreateTdDto) {}
