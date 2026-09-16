import { Injectable } from '@nestjs/common';
import { CreateSessionQuestionDto } from './dto/create-session-question.dto';
import { UpdateSessionQuestionDto } from './dto/update-session-question.dto';

@Injectable()
export class SessionQuestionService {
  create(createSessionQuestionDto: CreateSessionQuestionDto) {
    return 'This action adds a new sessionQuestion';
  }

  findAll() {
    return `This action returns all sessionQuestion`;
  }

  findOne(id: number) {
    return `This action returns a #${id} sessionQuestion`;
  }

  update(id: number, updateSessionQuestionDto: UpdateSessionQuestionDto) {
    return `This action updates a #${id} sessionQuestion`;
  }

  remove(id: number) {
    return `This action removes a #${id} sessionQuestion`;
  }
}
