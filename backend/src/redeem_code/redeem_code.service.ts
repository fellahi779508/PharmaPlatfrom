import { Injectable } from '@nestjs/common';
import { CreateRedeemCodeDto } from './dto/create-redeem_code.dto';
import { UpdateRedeemCodeDto } from './dto/update-redeem_code.dto';

@Injectable()
export class RedeemCodeService {
  create(createRedeemCodeDto: CreateRedeemCodeDto) {
    return 'This action adds a new redeemCode';
  }

  findAll() {
    return `This action returns all redeemCode`;
  }

  findOne(id: number) {
    return `This action returns a #${id} redeemCode`;
  }

  update(id: number, updateRedeemCodeDto: UpdateRedeemCodeDto) {
    return `This action updates a #${id} redeemCode`;
  }

  remove(id: number) {
    return `This action removes a #${id} redeemCode`;
  }
}
