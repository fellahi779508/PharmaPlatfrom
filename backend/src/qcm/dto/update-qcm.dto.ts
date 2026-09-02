import { PartialType } from '@nestjs/mapped-types';
import { CreateQcmDto } from './create-qcm.dto';

export class UpdateQcmDto extends PartialType(CreateQcmDto) {}
