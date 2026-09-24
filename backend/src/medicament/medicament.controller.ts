import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { MedicamentService } from './medicament.service';
import { CreateMedicamentDto } from './dto/create-medicament.dto';
import { UpdateMedicamentDto } from './dto/update-medicament.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';

@Controller('medicament')
@UseGuards(JwtAuthGuard)
export class MedicamentController {
  constructor(private readonly medicamentService: MedicamentService) { }

  /** Public read for authenticated users. */
  @Get()
  findAll(@Query('search') search?: string) {
    return this.medicamentService.findAll(search);
  }

  /** Random medicament — used by the flashcard. */
  @Get('random')
  findRandom() {
    return this.medicamentService.findRandom();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.medicamentService.findOne(id);
  }

  /* ---------- Write (admin / teacher only) ---------- */

  @Post()
  @Roles(Role.ADMIN, Role.OWNER, Role.TEACHER)
  @UseGuards(RolesGuard)
  create(@Body() dto: CreateMedicamentDto) {
    return this.medicamentService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.OWNER, Role.TEACHER)
  @UseGuards(RolesGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMedicamentDto,
  ) {
    return this.medicamentService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.OWNER)
  @UseGuards(RolesGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.medicamentService.remove(id);
  }
}