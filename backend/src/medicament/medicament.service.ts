import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';

import { Medicament } from './entities/medicament.entity';
import { CreateMedicamentDto } from './dto/create-medicament.dto';
import { UpdateMedicamentDto } from './dto/update-medicament.dto';

@Injectable()
export class MedicamentService {
  constructor(
    @InjectRepository(Medicament)
    private readonly medicamentRepo: Repository<Medicament>,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) { }

  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }

  /* ------------------------------------------------------------------ */
  /* Create                                                              */
  /* ------------------------------------------------------------------ */

  async create(dto: CreateMedicamentDto): Promise<Medicament> {
    const medicament = this.medicamentRepo.create(dto);
    return this.medicamentRepo.save(medicament);
  }

  /* ------------------------------------------------------------------ */
  /* Read                                                                */
  /* ------------------------------------------------------------------ */

  async findAll(search?: string) {
    const where = search?.trim()
      ? [
        { name: ILike(`%${search.trim()}%`) },
        { dci: ILike(`%${search.trim()}%`) },
      ]
      : undefined;

    return this.medicamentRepo.find({
      where,
      relations: { image: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Medicament> {
    const medicament = await this.medicamentRepo.findOne({
      where: { id },
      relations: { image: true },
    });

    if (!medicament) {
      throw new NotFoundException(
        this.i18n.translate('errors.medicament.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    return medicament;
  }

  /** Random pick for the flashcard flow. */
  async findRandom(): Promise<Medicament | null> {
    return this.medicamentRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.image', 'image')
      .orderBy('RANDOM()') // Postgres. MySQL: RAND()
      .limit(1)
      .getOne();
  }

  /* ------------------------------------------------------------------ */
  /* Update / delete                                                     */
  /* ------------------------------------------------------------------ */

  async update(
    id: number,
    dto: UpdateMedicamentDto,
  ): Promise<Medicament> {
    const medicament = await this.findOne(id);
    Object.assign(medicament, dto);
    return this.medicamentRepo.save(medicament);
  }

  async remove(id: number): Promise<{ success: true }> {
    const medicament = await this.findOne(id);
    await this.medicamentRepo.remove(medicament);
    return { success: true };
  }
}