import { Injectable } from '@nestjs/common';
import { CreateQcmDto } from './dto/create-qcm.dto';
import { UpdateQcmDto } from './dto/update-qcm.dto';

@Injectable()
export class QcmService {
  create(createQcmDto: CreateQcmDto) {
    return 'This action adds a new qcm';
  }

  findAll() {
    return `This action returns all qcm`;
  }

  findOne(id: number) {
    return `This action returns a #${id} qcm`;
  }

  update(id: number, updateQcmDto: UpdateQcmDto) {
    return `This action updates a #${id} qcm`;
  }

  remove(id: number) {
    return `This action removes a #${id} qcm`;
  }
}
