import { Exam } from 'src/exam/entities/exam.entity';
import { RoomPlayer } from 'src/room-player/entities/room-player.entity';
import { Session } from 'src/session/entities/session.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RoomStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum RoomMode {
  EXAM_SIMULATION = 'exam_simulation',
  QCM_SPEED_RUN = 'qcm_speed_run',
}

@Entity('room')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 6-character join code */
  @Column({ length: 6, unique: true })
  code: string;

  @Column({ type: 'enum', enum: RoomMode, default: RoomMode.QCM_SPEED_RUN })
  mode: RoomMode;

  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.WAITING })
  status: RoomStatus;

  /** Number of QCMs in the speed run */
  @Column({ type: 'int', default: 10 })
  qcmCount: number;

  /** Seconds per question (0 = no timer) */
  @Column({ type: 'int', default: 30 })
  timerSeconds: number;

  /** Current question index during a live session */
  @Column({ type: 'int', default: 0 })
  currentQuestionIndex: number;

  /** UUID of the host user */
  @Column({ type: 'uuid', nullable: true })
  hostId: string | null;

  /** Whether the host has an activated account */
  @Column({ type: 'boolean', default: false })
  requiresActivatedAccount: boolean;

  /** Flat ordered list of qcm IDs for this room (JSON array) */
  @Column({ type: 'jsonb', nullable: true })
  qcmIds: number[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Session, (session) => session.room, { nullable: true, onDelete: 'CASCADE' })
  session: Session | null;

  @ManyToOne(() => Exam, (exam) => exam.room, { nullable: true, onDelete: 'CASCADE' })
  exam: Exam | null;

  @OneToMany(() => RoomPlayer, (roomPlayer) => roomPlayer.room, { cascade: true })
  roomPlayers: RoomPlayer[];
}
