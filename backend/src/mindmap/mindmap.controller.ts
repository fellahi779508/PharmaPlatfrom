import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MindmapService } from './mindmap.service';
import { CreateMindmapDto } from './dto/create-mindmap.dto';
import { UpdateMindmapDto } from './dto/update-mindmap.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';

@Controller('mindmaps')
export class MindmapController {
  constructor(private readonly mindmapService: MindmapService) { }
  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createMindmapDto: CreateMindmapDto) {
    return this.mindmapService.create(createMindmapDto);
  }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.mindmapService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('/course/:courseId')
  findByCourseId(@Param('courseId') courseId: number) {
    return this.mindmapService.findByCourseId(+courseId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mindmapService.findOne(+id);
  }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMindmapDto: UpdateMindmapDto) {
    return this.mindmapService.update(+id, updateMindmapDto);
  }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mindmapService.remove(+id);
  }
}
