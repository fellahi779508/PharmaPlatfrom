import { Injectable } from '@nestjs/common';
import { CreateSessionQuestionAnswerDto } from './dto/create-session-question-answer.dto';
import { UpdateSessionQuestionAnswerDto } from './dto/update-session-question-answer.dto';

@Injectable()
export class SessionQuestionAnswerService {
  create(createSessionQuestionAnswerDto: CreateSessionQuestionAnswerDto) {
    return 'This action adds a new sessionQuestionAnswer';
  }

  findAll() {
    return `This action returns all sessionQuestionAnswer`;
  }

  findOne(id: number) {
    return `This action returns a #${id} sessionQuestionAnswer`;
  }

  update(id: number, updateSessionQuestionAnswerDto: UpdateSessionQuestionAnswerDto) {
    return `This action updates a #${id} sessionQuestionAnswer`;
  }

  remove(id: number) {
    return `This action removes a #${id} sessionQuestionAnswer`;
  }
}
