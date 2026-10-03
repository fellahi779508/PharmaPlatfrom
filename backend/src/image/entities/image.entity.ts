import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Summary } from 'src/summary/entities/summary.entity';
import { Medicament } from 'src/medicament/entities/medicament.entity';
import { Qcm } from 'src/qcm/entities/qcm.entity';

@Entity('image')
export class Image {
    @PrimaryGeneratedColumn()
    id: number;

    /** Cloudinary secure URL — use this in the frontend. */
    @Column({ type: 'text' })
    url: string;

    /** Cloudinary public_id — needed for deletion. Never expose to clients. */
    @Column({ type: 'varchar' })
    publicId: string;

    @Column({ type: 'varchar', nullable: true })
    format: string | null;

    @Column({ type: 'int', default: 0 })
    width: number;

    @Column({ type: 'int', default: 0 })
    height: number;

    @Column({ type: 'int', default: 0 })
    bytes: number;

    /** Optional: original file name for display / audit. */
    @Column({ type: 'varchar', nullable: true })
    originalName: string | null;

    /**
     * The Image owns the FK column (summary_id) via @JoinColumn, so the
     * Summary entity keeps its current shape — we only add an inverse
     * relation there.
     */
    @OneToOne(() => Summary, (summary) => summary.image, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'summaryId' })
    summary: Summary;

    @OneToOne(() => Medicament, (medicament) => medicament.image, {
        onDelete: 'CASCADE',
        nullable: true,
    })
    @JoinColumn({ name: 'medicamentId' })
    medicament: Medicament | null;

    @Column({ type: 'int', nullable: true })
    medicamentId: number | null;

    @Column({ type: 'int', nullable: true })
    summaryId: number | null;

    @CreateDateColumn()
    createdAt: Date;

    @OneToOne(() => Qcm, (qcm) => qcm.image, {
        onDelete: 'CASCADE',
        nullable: true,
    })
    @JoinColumn({ name: 'qcmId' })
    qcm: Qcm | null;

    @Column({ type: 'int', nullable: true })
    qcmId: number | null;
}