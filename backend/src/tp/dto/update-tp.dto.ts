import { PartialType } from '@nestjs/mapped-types';
import { CreateTpDto } from './create-tp.dto';

export class UpdateTpDto extends PartialType(CreateTpDto) {}
