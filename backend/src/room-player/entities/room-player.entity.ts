import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Room } from "src/room/entities/room.entity";
import { User } from "src/user/entities/user.entity";

@Entity("room_player")
export class RoomPlayer {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Room, (room) => room.roomPlayers, { onDelete: 'CASCADE', nullable: false })
    room: Room;

    @ManyToOne(() => User, (user) => user.roomPlayers, { onDelete: 'CASCADE', nullable: false })
    user: User;

    @Column()
    score: number;

    @Column()
    time: number;

    @Column()
    rank: number;

    @Column({ default: false, type: 'boolean' })
    isHost: boolean;

    @Column({ default: false, type: 'boolean' })
    isReady: boolean;

    @Column()
    status: string;

    @Column({ type: 'int', default: 0 })
    correctAnswersCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
