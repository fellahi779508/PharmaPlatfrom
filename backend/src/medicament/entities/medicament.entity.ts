import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Image } from 'src/image/entities/image.entity';

@Entity('medicament')
export class Medicament {
    @PrimaryGeneratedColumn()
    id: number;

    /** Commercial / brand name (e.g. "Doliprane"). */
    @Index()
    @Column()
    name: string;

    /** International Nonproprietary Name / molecule (e.g. "Paracétamol"). */
    @Index()
    @Column({ nullable: true })
    dci: string;

    /** Therapeutic class (e.g. "Antalgique", "Antibiotique"). */
    @Column({ nullable: true })
    therapeuticClass: string;

    /** Pharmaceutical form (e.g. "Comprimé", "Sirop", "Injectable"). */
    @Column({ nullable: true })
    form: string;

    /** Dosage (e.g. "500 mg", "1 g / 100 ml"). */
    @Column({ nullable: true })
    dosage: string;

    /** Free-text indication(s). */
    @Column({ type: 'text', nullable: true })
    indication: string;

    /** Free-text contraindications. */
    @Column({ type: 'text', nullable: true })
    contraindications: string | null;

    /** Free-text side effects. */
    @Column({ type: 'text', nullable: true })
    sideEffects: string | null;

    /** Posology / dosing. */
    @Column({ type: 'text', nullable: true })
    posology: string | null;

    /** Extra notes for the flashcard (mechanism, warnings, interactions…). */
    @Column({ type: 'text', nullable: true })
    notes: string | null;

    /**
     * One-to-one with Image. The FK lives on the Image side
     * (`image.medicamentId`), matching how Summary is wired.
     */
    @OneToOne(() => Image, (image) => image.medicament)
    image: Image;


    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}