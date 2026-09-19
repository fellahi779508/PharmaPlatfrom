import { Course } from "src/course/entities/course.entity";
import { Mindmap } from "src/mindmap/entities/mindmap.entity";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('summary')
export class Summary {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    text: string;

    @OneToOne(() => Course, course => course.summary, { onDelete: 'CASCADE' })
    course: Course;

    @OneToOne(() => Mindmap, mindmap => mindmap.summary, { onDelete: 'CASCADE' })
    @JoinColumn()
    mindmap: Mindmap;

}
