import { Injectable } from '@nestjs/common';
import { CreateQcmAnswerDto } from './dto/create-qcm_answer.dto';
import { UpdateQcmAnswerDto } from './dto/update-qcm_answer.dto';

@Injectable()
export class QcmAnswerService {
  create(createQcmAnswerDto: CreateQcmAnswerDto) {
    return 'This action adds a new qcmAnswer';
  }

  findAll() {
    return `This action returns all qcmAnswer`;
  }

  findOne(id: number) {
    return `This action returns a #${id} qcmAnswer`;
  }

  update(id: number, updateQcmAnswerDto: UpdateQcmAnswerDto) {
    return `This action updates a #${id} qcmAnswer`;
  }

  remove(id: number) {
    return `This action removes a #${id} qcmAnswer`;
  }
}
