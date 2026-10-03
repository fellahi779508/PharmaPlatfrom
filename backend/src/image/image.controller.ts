import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { ImageService } from './image.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { SubscriptionGuard } from 'src/auth/guards/jwt-auth/subscription.guard';

@Controller('images')
@UseGuards(JwtAuthGuard)
export class ImageController {
  constructor(private readonly imageService: ImageService) { }

  /**
   * Upload (or replace) the image attached to a summary.
   *
   * multipart/form-data
   *   field name: file
   */
  @Post('summary/:summaryId')
  @Roles(Role.ADMIN, Role.OWNER, Role.TEACHER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB hard cap
    }),
  )
  upload(
    @Param('summaryId', ParseIntPipe) summaryId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('file is required');
    return this.imageService.uploadForSummary(summaryId, file);
  }

  @Post('medicament/:medicamentId')
  @Roles(Role.ADMIN, Role.OWNER, Role.TEACHER)
  @UseGuards(RolesGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadMedicament(
    @Param('medicamentId', ParseIntPipe) medicamentId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('file is required');
    return this.imageService.uploadForMedicament(medicamentId, file);
  }

  @Post('qcm/:qcmId')
  @Roles(Role.ADMIN, Role.OWNER, Role.TEACHER)
  @UseGuards(RolesGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadQcm(
    @Param('qcmId', ParseIntPipe) qcmId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('file is required');
    return this.imageService.uploadForQcm(qcmId, file);
  }

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get('qcm/:qcmId')
  findByQcm(@Param('qcmId', ParseIntPipe) qcmId: number) {
    return this.imageService.findByQcm(qcmId);
  }

  @Delete('qcm/:qcmId')
  @Roles(Role.ADMIN, Role.OWNER, Role.TEACHER)
  @UseGuards(RolesGuard)
  removeQcmImage(
    @Param('qcmId', ParseIntPipe) qcmId: number,
  ) {
    return this.imageService.removeForQcm(qcmId);
  }

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get('medicament/:medicamentId')
  findByMedicament(@Param('medicamentId', ParseIntPipe) medicamentId: number) {
    return this.imageService.findByMedicament(medicamentId);
  }

  @Delete('medicament/:medicamentId')
  @Roles(Role.ADMIN, Role.OWNER, Role.TEACHER)
  @UseGuards(RolesGuard)
  removeMedicamentImage(
    @Param('medicamentId', ParseIntPipe) medicamentId: number,
  ) {
    return this.imageService.removeForMedicament(medicamentId);
  }

  /** Get the image attached to a summary, or null. */
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get('summary/:summaryId')
  findBySummary(@Param('summaryId', ParseIntPipe) summaryId: number) {
    return this.imageService.findBySummary(summaryId);
  }

  /** Delete the image attached to a summary. */
  @Delete('summary/:summaryId')
  @Roles(Role.ADMIN, Role.OWNER, Role.TEACHER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  removeForSummary(@Param('summaryId', ParseIntPipe) summaryId: number) {
    return this.imageService.removeForSummary(summaryId);
  }
}