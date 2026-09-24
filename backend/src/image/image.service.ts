import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';

import { Image } from './entities/image.entity';
import { Summary } from 'src/summary/entities/summary.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Medicament } from 'src/medicament/entities/medicament.entity';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

@Injectable()
export class ImageService {
  constructor(
    @InjectRepository(Image)
    private readonly imageRepo: Repository<Image>,
    private readonly dataSource: DataSource,
    private readonly cloudinary: CloudinaryService,
    private readonly i18n: I18nService,
  ) { }

  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }

  /* ------------------------------------------------------------------ */
  /* Upload / replace                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Uploads a new image for a summary.
   * If the summary already has an image, the old one is deleted from
   * Cloudinary and its row is replaced.
   */
  async uploadForSummary(
    summaryId: number,
    file: Express.Multer.File,
  ): Promise<Image> {
    if (!file) throw new BadRequestException('File is required');

    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME.join(', ')}`,
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException(
        `File too large. Max ${MAX_SIZE_BYTES / 1024 / 1024} MB.`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const summary = await manager.getRepository(Summary).findOne({
        where: { id: summaryId },
        relations: { image: true },
      });

      if (!summary) {
        throw new NotFoundException(
          this.i18n.translate('errors.summary.not_found', {
            lang: this.currentLang,
          }),
        );
      }

      // ---- If an image already exists, capture its public id ----
      const previous = summary.image;
      const previousPublicId = previous?.publicId ?? null;
      const previousId = previous?.id ?? null;

      // ---- Upload the new file first, so a failed upload doesn't wipe
      //      the existing image ----
      const uploaded = await this.cloudinary.uploadBuffer(file, 'summaries');

      // ---- Persist the new row ----
      const newImage = manager.getRepository(Image).create({
        url: uploaded.secureUrl,
        publicId: uploaded.publicId,
        format: uploaded.format,
        width: uploaded.width,
        height: uploaded.height,
        bytes: uploaded.bytes,
        originalName: file.originalname ?? null,
        summaryId,
      });

      const saved = await manager.getRepository(Image).save(newImage);

      // ---- Delete the old Cloudinary asset + row (best effort) ----
      if (previousId) {
        // Delete the DB row inside the same transaction
        await manager.getRepository(Image).delete(previousId);
      }

      // Cloudinary delete runs after the transaction commits ideally —
      // we do it here and tolerate failure since the DB is already clean.
      if (previousPublicId) {
        this.cloudinary
          .destroy(previousPublicId)
          .catch((e) =>
            console.warn('Failed to delete old Cloudinary asset:', e),
          );
      }

      return saved;
    });
  }

  async uploadForMedicament(
    medicamentId: number,
    file: Express.Multer.File,
  ): Promise<Image> {
    if (!file) throw new BadRequestException('File is required');

    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}`,
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException(
        `File too large. Max ${MAX_SIZE_BYTES / 1024 / 1024} MB.`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const medicament = await manager
        .getRepository(Medicament)
        .findOne({
          where: { id: medicamentId },
          relations: { image: true },
        });

      if (!medicament) {
        throw new NotFoundException('Medicament not found');
      }

      const previous = medicament.image;
      const previousPublicId = previous?.publicId ?? null;
      const previousId = previous?.id ?? null;

      // Upload first — a failure keeps the old image intact
      const uploaded = await this.cloudinary.uploadBuffer(file, 'medicaments');

      const newImage = manager.getRepository(Image).create({
        url: uploaded.secureUrl,
        publicId: uploaded.publicId,
        format: uploaded.format,
        width: uploaded.width,
        height: uploaded.height,
        bytes: uploaded.bytes,
        originalName: file.originalname ?? null,
        medicamentId,
        summaryId: null, // never both
      });

      const saved = await manager.getRepository(Image).save(newImage);

      if (previousId) {
        await manager.getRepository(Image).delete(previousId);
      }
      if (previousPublicId) {
        this.cloudinary
          .destroy(previousPublicId)
          .catch((e) => console.warn('Cloudinary cleanup failed:', e));
      }

      return saved;
    });
  }

  async findByMedicament(medicamentId: number): Promise<Image | null> {
    return this.imageRepo.findOne({ where: { medicamentId } });
  }

  async removeForMedicament(
    medicamentId: number,
  ): Promise<{ success: true }> {
    const image = await this.imageRepo.findOne({ where: { medicamentId } });
    if (!image) return { success: true };

    await this.imageRepo.remove(image);
    this.cloudinary.destroy(image.publicId).catch(() => { });
    return { success: true };
  }

  /* ------------------------------------------------------------------ */
  /* Reads                                                               */
  /* ------------------------------------------------------------------ */

  async findBySummary(summaryId: number): Promise<Image | null> {
    return this.imageRepo.findOne({
      where: { summaryId },
    });
  }

  async findOne(id: number): Promise<Image> {
    const image = await this.imageRepo.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException(
        this.i18n.translate('errors.image.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    return image;
  }

  /* ------------------------------------------------------------------ */
  /* Delete                                                              */
  /* ------------------------------------------------------------------ */

  async removeForSummary(summaryId: number): Promise<{ success: true }> {
    const image = await this.imageRepo.findOne({ where: { summaryId } });
    if (!image) return { success: true };

    // DB first, then Cloudinary (fire-and-forget).
    await this.imageRepo.remove(image);
    this.cloudinary.destroy(image.publicId).catch(() => { });

    return { success: true };
  }
}