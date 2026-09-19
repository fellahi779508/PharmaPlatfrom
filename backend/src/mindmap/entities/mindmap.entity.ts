import { Summary } from "src/summary/entities/summary.entity";
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('mindmap')
export class Mindmap {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ type: 'json' })
    jsonContent: JSON;

    @OneToOne(() => Summary, (summary) => summary.mindmap, { onDelete: 'CASCADE' })
    summary: Summary;




}
