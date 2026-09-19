import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Req,
} from '@nestjs/common';
import { QcmService } from './qcm.service';
import { CreateQcmDto } from './dto/create-qcm.dto';
import { UpdateQcmDto } from './dto/update-qcm.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import mammoth from 'mammoth';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';

interface File {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}
// @UseGuards(JwtAuthGuard)
@Controller('qcm')
export class QcmController {
  constructor(private readonly qcmService: QcmService) { }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createQcmDto: CreateQcmDto) {
    return this.qcmService.create(createQcmDto);
  }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Post('import-ai')
  @UseInterceptors(FileInterceptor('file'))
  async importFile(
    @UploadedFile() file: File,
    @Body('courseId') courseId: string,
    @Body('tdId') tdId?: string,
    @Body('tpId') tpId?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded.');
    if (!courseId) throw new BadRequestException('courseId is required.');

    // 1. Pass the raw file directly to Gemini (handles DOCX, PDF, and Images natively)
    const extractedQcms = await this.qcmService.extractQcmsFromFile(file);

    // 2. Map the extracted JSON array to your DTO and save via your transaction method
    const savedResults: any = [];
    for (const item of extractedQcms) {
      const dto: CreateQcmDto = {
        question: item.question,
        courseId: parseInt(courseId, 10),
        tdId: tdId ? parseInt(tdId, 10) : undefined,
        tpId: tpId ? parseInt(tpId, 10) : undefined,
        answers: item.answers,
      };

      // const saved = await this.qcmService.create(dto);
      savedResults.push(dto);
    }

    return {
      message: `Successfully imported ${savedResults.length} QCMs.`,
      data: savedResults,
    };
  }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async importFromDocx(
    @UploadedFile() file: File,
    @Body('courseId') courseId: string, // Received as string from form-data
    @Body('tdId') tdId?: string,
    @Body('tpId') tpId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    if (!courseId) {
      throw new BadRequestException('courseId is required.');
    }

    let rawText = '';

    // 1. Extract raw text based on file type
    if (file.originalname.endsWith('.docx')) {
      // Extract text from the Word document buffer
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      rawText = result.value;
    } else {
      throw new BadRequestException(
        'Only .docx files are supported currently.',
      );
    }

    // 2. Pass the extracted text to your new service function
    return this.qcmService.importQcmsFromText(
      rawText,
      parseInt(courseId, 10),
      tdId ? parseInt(tdId, 10) : undefined,
      tpId ? parseInt(tpId, 10) : undefined,
    );
  }


  @UseGuards(JwtAuthGuard)
  @Get(':id/generate-explanation')
  generateExplanation(@Param('id') id: string, @Req() req) {
    return this.qcmService.generateAiExplanation(+id, req.user.id);
  }

  @Get('course/:courseId')
  findByCourse(@Param('courseId') courseId: number) {
    return this.qcmService.findByCourse(courseId);
  }

  @Get()
  findAll() {
    return this.qcmService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.qcmService.findOne(+id);
  }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQcmDto: UpdateQcmDto) {
    return this.qcmService.update(+id, updateQcmDto);
  }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.qcmService.remove(+id);
  }
}
