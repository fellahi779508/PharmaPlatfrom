import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Room, RoomMode, RoomStatus } from './entities/room.entity';
import { RoomPlayer } from 'src/room-player/entities/room-player.entity';
import { CreateRoomDto, RoomMode as DtoRoomMode } from './dto/create-room.dto';
import { User } from 'src/user/entities/user.entity';
import { Exam } from 'src/exam/entities/exam.entity';
import { Session, SessionStatus } from 'src/session/entities/session.entity';
import { SessionQuestion } from 'src/session-question/entities/session-question.entity';
import { Qcm } from 'src/qcm/entities/qcm.entity';
import { QcmAnswer } from 'src/qcm_answer/entities/qcm_answer.entity';
import { ExamQcm } from 'src/exam/entities/examQcm.entity';
import { Course } from 'src/course/entities/course.entity';
import { Td } from 'src/td/entities/td.entity';
import { Tp } from 'src/tp/entities/tp.entity';
import { Subject } from 'src/subject/entities/subject.entity';
import { Semester } from 'src/semester/entities/semester.entity';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(RoomPlayer)
    private readonly roomPlayerRepo: Repository<RoomPlayer>,
    private readonly dataSource: DataSource,
  ) { }

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────
  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/I/1 confusion
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  private async uniqueCode(): Promise<string> {
    let code: string;
    let exists: Room | null;
    do {
      code = this.generateCode();
      exists = await this.roomRepo.findOne({ where: { code } });
    } while (exists);
    return code;
  }

  // ─────────────────────────────────────────────────────────────
  // CREATE ROOM (host)
  // ─────────────────────────────────────────────────────────────
  async create(dto: CreateRoomDto, hostId: string): Promise<Room> {
    return this.dataSource.transaction(async (manager) => {
      const code = await this.uniqueCode();

      // Validate content
      if (!dto.content) {
        throw new BadRequestException('Content selection is required');
      }

      // Fetch QCMs from selected content
      const qcmIds = await this.fetchQcmsFromContent((manager as any), dto.content, dto.qcmCount);

      if (qcmIds.length === 0) {
        throw new BadRequestException('No QCMs available for the selected content');
      }

      // Fetch host user
      const userRepo = manager.getRepository(User);
      const host = await userRepo.findOne({
        where: { id: hostId },
        relations: { demoYear: true, redeemCode: { year: true } },
      });
      if (!host) throw new NotFoundException('Host user not found');

      // Create session or exam based on mode
      let session: Session | null = null;
      let exam: Exam | null = null;

      if (dto.mode === DtoRoomMode.QCM_SPEED_RUN) {
        // Create a temporary session for this room
        const sessionRepo = manager.getRepository(Session);
        const qcmRepo = manager.getRepository(Qcm);
        const sessionQuestionRepo = manager.getRepository(SessionQuestion);

        session = sessionRepo.create({
          name: `Challenge Room ${code}`,
          status: SessionStatus.NOT_STARTED,
          currentQuestionId: null,
          totalQuestions: qcmIds.length,
          correctCount: 0,
          user: host,
        });
        session = await sessionRepo.save(session);

        // Create session questions
        for (let i = 0; i < qcmIds.length; i++) {
          const qcm = await qcmRepo.findOne({ where: { id: qcmIds[i] } });
          if (!qcm) continue;

          const sessionQuestion = sessionQuestionRepo.create({
            session,
            qcm,
            position: i,
            isAnswered: false,
            isRevealed: false,


          });
          await sessionQuestionRepo.save(sessionQuestion);
        }
      } else {
        // exam_simulation - create a temporary exam
        const subjectRepo = manager.getRepository(Subject);
        const semesterRepo = manager.getRepository(Semester);
        const examRepo = manager.getRepository(Exam);
        const qcmRepo = manager.getRepository(Qcm);
        const examQcmRepo = manager.getRepository(ExamQcm);

        const subject = await subjectRepo.findOne({
          where: { id: dto.content.subjectId },
        });
        if (!subject) throw new NotFoundException('Subject not found');

        const semester = dto.content.semesterId
          ? await semesterRepo.findOne({ where: { id: dto.content.semesterId } })
          : undefined;

        exam = examRepo.create({
          title: `Challenge Exam ${code}`,
          subject,
          semester: semester || undefined,
          questionCount: qcmIds.length,
          durationMinutes: Math.ceil((dto.qcmCount * dto.timerSeconds) / 60),
        });
        exam = await examRepo.save(exam);

        // Create exam QCMs
        for (let i = 0; i < qcmIds.length; i++) {
          const qcm = await qcmRepo.findOne({ where: { id: qcmIds[i] } });
          if (!qcm) continue;

          const examQcm = examQcmRepo.create({
            exam,
            qcm,
            order: i,          // 👈 required — matches NOT NULL constraint
          });
          await examQcmRepo.save(examQcm);
        }
      }

      // Create room
      const CreateRoom = manager.create(Room, {
        code,
        mode: dto.mode as unknown as RoomMode,
        status: RoomStatus.WAITING,
        qcmCount: qcmIds.length,
        timerSeconds: dto.timerSeconds,
        currentQuestionIndex: 0,
        hostId,
        requiresActivatedAccount: host.isActive,
        qcmIds,
        session,
        exam,
      });

      const savedRoom = await manager.save(Room, CreateRoom);

      // Add host as a player
      const roomPlayerRepo = manager.getRepository(RoomPlayer);

      const hostPlayer = roomPlayerRepo.create({
        room: savedRoom,
        user: host,
        score: 0,
        time: 0,
        rank: 0,
        isHost: true,
        isReady: true,
        status: 'waiting',
        correctAnswersCount: 0,
      });
      await roomPlayerRepo.save(hostPlayer);

      // Fetch the room with relations within the transaction
      const roomRepo = manager.getRepository(Room);
      const room = await roomRepo.findOne({
        where: { id: savedRoom.id },
        relations: { roomPlayers: { user: true }, session: true, exam: true },
      });

      if (!room) throw new NotFoundException('Room not found after creation');
      return room;
    });
  }
  // ─────────────────────────────────────────────────────────────
  // RESET ROOM FOR REMATCH (host only)
  // ─────────────────────────────────────────────────────────────
  async resetRoom(roomId: string, hostId: string): Promise<Room> {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.hostId !== hostId) {
      throw new BadRequestException('Only the host can start a rematch');
    }

    // Wipe every player's score/ready state
    await this.roomPlayerRepo.update(
      { room: { id: roomId } },
      {
        score: 0,
        time: 0,
        rank: 0,
        correctAnswersCount: 0,
        isReady: false,
        status: 'waiting',
      },
    );

    // Host is always ready
    await this.roomPlayerRepo.update(
      { room: { id: roomId }, isHost: true },
      { isReady: true },
    );

    // Back to waiting, question index 0
    await this.roomRepo.update(roomId, {
      status: RoomStatus.WAITING,
      currentQuestionIndex: 0,
    });

    const updated = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: { roomPlayers: { user: true }, session: true, exam: true },
    });
    if (!updated) throw new NotFoundException('Room not found after reset');
    return updated;
  }

  // ─────────────────────────────────────────────────────────────
  // FETCH QCMS FROM CONTENT
  // ─────────────────────────────────────────────────────────────
  private async fetchQcmsFromContent(
    manager: DataSource,
    content: any,
    qcmCount: number,
  ): Promise<number[]> {
    let qcmIds: number[] = [];

    // Validate content object
    if (!content) {
      throw new BadRequestException('Content is required');
    }

    if (!content.subjectId) {
      throw new BadRequestException('Subject ID is required');
    }

    // Fetch QCMs from courses
    if (content.courseIds && Array.isArray(content.courseIds) && content.courseIds.length > 0) {
      const courseRepo = manager.getRepository(Course);
      const courses = await courseRepo.find({
        where: content.courseIds.map((id: number) => ({ id })),
        relations: { qcms: true },
      });
      for (const course of courses) {
        if (course.qcms) {
          qcmIds.push(...course.qcms.map((q: Qcm) => q.id));
        }
      }
    }

    // Fetch QCMs from TDs
    if (content.tdIds && Array.isArray(content.tdIds) && content.tdIds.length > 0) {
      const tdRepo = manager.getRepository(Td);
      const tds = await tdRepo.find({
        where: content.tdIds.map((id: number) => ({ id })),
        relations: { qcms: true },
      });
      for (const td of tds) {
        if (td.qcms) {
          qcmIds.push(...td.qcms.map((q: Qcm) => q.id));
        }
      }
    }

    // Fetch QCMs from TPs
    if (content.tpIds && Array.isArray(content.tpIds) && content.tpIds.length > 0) {
      const tpRepo = manager.getRepository(Tp);
      const tps = await tpRepo.find({
        where: content.tpIds.map((id: number) => ({ id })),
        relations: { qcms: true },
      });
      for (const tp of tps) {
        if (tp.qcms) {
          qcmIds.push(...tp.qcms.map((q: Qcm) => q.id));
        }
      }
    }

    // If no specific content selected, fetch from subject
    if (qcmIds.length === 0) {
      const subjectRepo = manager.getRepository(Subject);
      const subject = await subjectRepo.findOne({
        where: { id: content.subjectId },
        relations: { courses: { qcms: true }, tds: { qcms: true }, tps: { qcms: true } },
      });
      if (subject) {
        if (subject.courses) {
          for (const course of subject.courses) {
            if (course.qcms) {
              qcmIds.push(...course.qcms.map((q: Qcm) => q.id));
            }
          }
        }
        if (subject.tds) {
          for (const td of subject.tds) {
            if (td.qcms) {
              qcmIds.push(...td.qcms.map((q: Qcm) => q.id));
            }
          }
        }
        if (subject.tps) {
          for (const tp of subject.tps) {
            if (tp.qcms) {
              qcmIds.push(...tp.qcms.map((q: Qcm) => q.id));
            }
          }
        }
      }
    }

    // Remove duplicates and shuffle
    qcmIds = [...new Set(qcmIds)];
    qcmIds = qcmIds.sort(() => 0.5 - Math.random());

    // Limit to requested count
    return qcmIds.slice(0, qcmCount);
  }

  // ─────────────────────────────────────────────────────────────
  // JOIN ROOM (by code)
  // ─────────────────────────────────────────────────────────────
  async joinRoom(code: string, userId: string): Promise<{ room: Room; player: RoomPlayer }> {
    const room = await this.roomRepo.findOne({
      where: { code: code.toUpperCase() },
      relations: { roomPlayers: { user: true } },
    });

    if (!room) throw new NotFoundException('Room not found with code: ' + code);
    if (room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('Room has already started or completed');
    }

    const alreadyIn = room.roomPlayers.find((p) => p.user.id === userId);
    if (alreadyIn) {
      return { room, player: alreadyIn };
    }

    const userRepo = this.dataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: userId },
      relations: { demoYear: true, redeemCode: { year: true } },
    });
    if (!user) throw new NotFoundException('User not found');

    // Check if host has activated account and enforce matching activation status
    if (room.requiresActivatedAccount && !user.isActive) {
      throw new BadRequestException('This room requires an activated account to join');
    }
    if (!room.requiresActivatedAccount && !user.isDemo) {
      throw new BadRequestException('This room is for demo accounts only');
    }

    // Get the year ID for both host and joining user
    const getYearId = (u: User): number | null => {
      // For demo users, get from demoYear
      if (u.isDemo && u.demoYear) {
        return u.demoYear.id;
      }
      // For activated users, get from redeemCode.year
      if (!u.isDemo && u.redeemCode?.year) {
        return u.redeemCode.year.id;
      }
      return null;
    };

    // Check if both are in the same year
    if (!room.hostId) throw new NotFoundException('Host user not found');

    const host = await userRepo.findOne({
      where: { id: room.hostId },
      relations: { demoYear: true, redeemCode: { year: true } },
    });
    if (!host) throw new NotFoundException('Host user not found');

    const hostYearId = getYearId(host);
    const userYearId = getYearId(user);

    if (hostYearId !== null && userYearId !== null && hostYearId !== userYearId) {
      throw new BadRequestException('You must be subscribed to the same year as the host to join this room');
    }

    const player = this.roomPlayerRepo.create({
      room,
      user,
      score: 0,
      time: 0,
      rank: 0,
      isHost: false,
      isReady: false,
      status: 'waiting',
      correctAnswersCount: 0,
    });

    const savedPlayer = await this.roomPlayerRepo.save(player);

    // 👇 RE-FETCH so roomPlayers includes the newly added player
    const updatedRoom = await this.roomRepo.findOne({
      where: { id: room.id },
      relations: { roomPlayers: { user: true }, session: true, exam: true },
    });

    return { room: updatedRoom ?? room, player: savedPlayer };
  }
  // ─────────────────────────────────────────────────────────────
  // GET ROOM WITH QCM QUESTION for a given index
  // ─────────────────────────────────────────────────────────────
  async getQuestion(roomId: string, index: number) {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (!room.qcmIds || index >= room.qcmIds.length) {
      return null; // game finished
    }

    const qcmId = room.qcmIds[index];
    const qcm = await this.dataSource.getRepository(Qcm).findOne({
      where: { id: qcmId },
      relations: { answers: true, image: true },
    });

    if (!qcm) throw new NotFoundException(`QCM ${qcmId} not found`);

    // Shuffle answers
    const shuffled = [...qcm.answers].sort(() => 0.5 - Math.random());

    return {
      questionIndex: index,
      totalQuestions: room.qcmIds.length,
      timerSeconds: room.timerSeconds,
      qcm: {
        id: qcm.id,
        question: qcm.question,
        image: qcm.image
          ? { id: qcm.image.id, url: qcm.image.url }
          : null,
        answers: shuffled.map((a) => ({ id: a.id, answer: a.answer })),
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // SUBMIT ANSWER — returns whether it was correct
  // ─────────────────────────────────────────────────────────────
  async submitAnswer(
    roomId: string,
    userId: string,
    questionIndex: number,
    selectedAnswerIds: number[],
    timeSpentMs: number,
  ): Promise<{ isCorrect: boolean; correctAnswerIds: number[]; questionText: string; allAnswers: { id: number; answer: string }[] }> {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room || !room.qcmIds) throw new NotFoundException('Room not found');

    const qcmId = room.qcmIds[questionIndex];
    const qcm = await this.dataSource.getRepository(Qcm).findOne({
      where: { id: qcmId },
      relations: { answers: true },
    });

    if (!qcm) throw new NotFoundException(`QCM ${qcmId} not found`);

    const answers = await this.dataSource.getRepository(QcmAnswer).find({
      where: { qcm: { id: qcmId } },
    });

    const correctIds = answers.filter((a) => a.isCorrect).map((a) => a.id);
    const selectedSet = new Set(selectedAnswerIds);
    const correctSet = new Set(correctIds);
    const isCorrect =
      selectedSet.size === correctSet.size &&
      [...selectedSet].every((id) => correctSet.has(id));

    // Update player score
    const player = await this.roomPlayerRepo.findOne({
      where: { room: { id: roomId }, user: { id: userId } },
    });

    if (player) {
      if (isCorrect) {
        player.correctAnswersCount += 1;

        const maxTimeMs = (room.timerSeconds > 0 ? room.timerSeconds : 30) * 1000;
        const ratio = Math.max(0, Math.min(1, 1 - timeSpentMs / maxTimeMs));

        const basePoints = 500;
        const speedBonus = Math.round(500 * ratio); // 0–500

        player.score += basePoints + speedBonus;     // 500–1000
      }
      player.time += timeSpentMs;
      await this.roomPlayerRepo.save(player);
    }

    return { 
      isCorrect, 
      correctAnswerIds: correctIds,
      questionText: qcm.question,
      allAnswers: answers.map(a => ({ id: a.id, answer: a.answer }))
    };
  }

  // ─────────────────────────────────────────────────────────────
  // FINALIZE ROOM — compute ranks
  // ─────────────────────────────────────────────────────────────
  async finalizeRoom(roomId: string): Promise<RoomPlayer[]> {
    const players = await this.roomPlayerRepo.find({
      where: { room: { id: roomId } },
      relations: { user: true },
      order: { score: 'DESC', time: 'ASC' },
    });

    for (let i = 0; i < players.length; i++) {
      players[i].rank = i + 1;
      players[i].status = 'completed';
    }

    await this.roomPlayerRepo.save(players);

    await this.roomRepo.update(roomId, { status: RoomStatus.COMPLETED });

    return players;
  }

  // ─────────────────────────────────────────────────────────────
  // UPDATE ROOM STATUS
  // ─────────────────────────────────────────────────────────────
  async setRoomInProgress(roomId: string): Promise<void> {
    await this.roomRepo.update(roomId, {
      status: RoomStatus.IN_PROGRESS,
      currentQuestionIndex: 0,
    });
  }

  async advanceQuestion(roomId: string): Promise<number> {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    const next = room.currentQuestionIndex + 1;
    await this.roomRepo.update(roomId, { currentQuestionIndex: next });
    return next;
  }

  // ─────────────────────────────────────────────────────────────
  // SET PLAYER READY
  // ─────────────────────────────────────────────────────────────
  async setPlayerReady(roomId: string, userId: string, isReady: boolean): Promise<boolean> {
    await this.roomPlayerRepo.update(
      { room: { id: roomId }, user: { id: userId } },
      { isReady },
    );

    const all = await this.roomPlayerRepo.find({ where: { room: { id: roomId } } });

    // Host is not required to be "ready" — only non-host players count
    const nonHostPlayers = all.filter((p) => !p.isHost);
    return nonHostPlayers.length > 0 && nonHostPlayers.every((p) => p.isReady);
  }

  // ─────────────────────────────────────────────────────────────
  // GETTERS
  // ─────────────────────────────────────────────────────────────
  async findById(id: string): Promise<Room> {
    const room = await this.roomRepo.findOne({
      where: { id },
      relations: { roomPlayers: { user: true }, session: true, exam: true },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async findByCode(code: string): Promise<Room> {
    const room = await this.roomRepo.findOne({
      where: { code: code.toUpperCase() },
      relations: { roomPlayers: { user: true }, session: true, exam: true },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async getLeaderboard(roomId: string): Promise<RoomPlayer[]> {
    return this.roomPlayerRepo.find({
      where: { room: { id: roomId } },
      relations: { user: true },
      order: { rank: 'ASC' },
    });
  }

  async removePlayer(roomId: string, userId: string): Promise<void> {
    await this.roomPlayerRepo.delete({
      room: { id: roomId },
      user: { id: userId },
    });
  }

  async deleteRoom(roomId: string, userId: string): Promise<void> {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.hostId !== userId) {
      throw new BadRequestException('Only the host can delete the room');
    }

    // Cascade delete will handle session/exam deletion due to onDelete: 'CASCADE'
    await this.roomRepo.delete(roomId);
  }
}
