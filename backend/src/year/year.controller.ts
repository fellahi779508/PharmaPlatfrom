import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { YearService } from './year.service';
import { CreateYearDto } from './dto/create-year.dto';
import { UpdateYearDto } from './dto/update-year.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { create } from 'domain';
import { SubscriptionGuard } from 'src/auth/guards/jwt-auth/subscription.guard';

@Controller('year')
export class YearController {
  constructor(private readonly yearService: YearService) { }

  @Roles(Role.ADMIN, Role.OWNER, Role.TEACHER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createYearDto: CreateYearDto) {
    return this.yearService.create(createYearDto);
  }

  @Roles(Role.ADMIN, Role.OWNER, Role.TEACHER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.yearService.findAll();
  }

  @Roles(Role.ADMIN, Role.OWNER, Role.TEACHER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.yearService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.OWNER, Role.TEACHER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: number, @Body() updateYearDto: UpdateYearDto) {
    return this.yearService.update(id, updateYearDto);
  }

  @Roles(Role.ADMIN, Role.OWNER, Role.TEACHER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.yearService.remove(id);
  }
}

