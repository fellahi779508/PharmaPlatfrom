import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Qcm } from 'src/qcm/entities/qcm.entity';
import { Medicament } from 'src/medicament/entities/medicament.entity';
import { Year } from 'src/year/entities/year.entity';

@Entity('daily_flashcard')
@Index(['yearId', 'date'], { unique: true })
export class DailyFlashcard {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    yearId: number;

    @ManyToOne(() => Year, { onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'yearId' })
    year: Year;

    /** UTC date in YYYY-MM-DD format. */
    @Column({ type: 'date' })
    date: string;

    /** Semester number used to pick the QCM. */
    @Column({ type: 'int', nullable: true })
    semesterNumber: number | null;

    /* ---------------- QCM (both can coexist) ---------------- */

    @Column({ type: 'int', nullable: true })
    qcmId: number | null;

    @ManyToOne(() => Qcm, {
        onDelete: 'SET NULL',
        eager: true,
        nullable: true,
    })
    @JoinColumn({ name: 'qcmId' })
    qcm: Qcm | null;

    /* ---------------- Medicament ---------------- */

    @Column({ type: 'int', nullable: true })
    medicamentId: number | null;

    @ManyToOne(() => Medicament, {
        onDelete: 'SET NULL',
        eager: true,
        nullable: true,
    })
    @JoinColumn({ name: 'medicamentId' })
    medicament: Medicament | null;

    @CreateDateColumn()
    createdAt: Date;
}