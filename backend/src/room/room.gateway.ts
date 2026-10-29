import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RoomService } from './room.service';

interface JoinRoomPayload { roomCode: string; userId: string; username: string; }
interface ReadyPayload { roomId: string; userId: string; }
interface StartGamePayload { roomId: string; userId: string; }
interface SubmitAnswerPayload {
  roomId: string; userId: string; questionIndex: number;
  selectedAnswerIds: number[]; timeSpentMs: number;
}
interface NextQuestionPayload { roomId: string; userId: string; }
interface LeaveRoomPayload { roomId: string; userId: string; }

const socketRoom = new Map<string, { roomId: string; userId: string }>();
const answeredTracker = new Map<string, Set<string>>();
const questionTimers = new Map<string, NodeJS.Timeout>();

@WebSocketGateway({
  namespace: 'room',
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('RoomGateway');

  constructor(private readonly roomService: RoomService) { }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const info = socketRoom.get(client.id);
    if (!info) return;

    const { roomId, userId } = info;
    socketRoom.delete(client.id);

    try {
      const room = await this.roomService.findById(roomId);

      if (room.hostId === userId) {
        await this.roomService.deleteRoom(roomId, userId);
        this.clearQuestionTimer(roomId);
        answeredTracker.delete(roomId);
        this.server.to(roomId).emit('room_deleted', { reason: 'Host left the room' });
        return;
      }

      if (room.status === 'waiting' as any) {
        await this.roomService.removePlayer(roomId, userId);
        this.server.to(roomId).emit('player_left', { userId });
        const updatedRoom = await this.roomService.findById(roomId);
        this.server.to(roomId).emit('room_updated', this.sanitizeRoom(updatedRoom));
      }
    } catch (_) { /* room may already be gone */ }
  }

  @SubscribeMessage('join_room')
  async onJoinRoom(
    @MessageBody() payload: JoinRoomPayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { room, player } = await this.roomService.joinRoom(payload.roomCode, payload.userId);
      client.join(room.id);
      socketRoom.set(client.id, { roomId: room.id, userId: payload.userId });

      const sanitized = this.sanitizeRoom(room);
      this.server.to(room.id).emit('room_updated', sanitized);

      client.emit('join_success', {
        room: sanitized,
        playerId: player.id,
        userId: payload.userId,
        isHost: player.isHost,
      });
    } catch (err) {
      this.logger.error('Error joining room:', err);
      client.emit('error', { message: (err as Error).message });
    }
  }

  @SubscribeMessage('player_ready')
  async onPlayerReady(
    @MessageBody() payload: ReadyPayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const allReady = await this.roomService.setPlayerReady(payload.roomId, payload.userId, true);
      const room = await this.roomService.findById(payload.roomId);
      const sanitized = this.sanitizeRoom(room);
      this.server.to(payload.roomId).emit('room_updated', sanitized);

      if (allReady) {
        this.server.to(payload.roomId).emit('all_ready', {
          message: 'All players are ready! Host can start the game.',
        });
      }
    } catch (err) {
      this.logger.error('Error in player_ready:', err);
      client.emit('error', { message: (err as Error).message });
    }
  }

  @SubscribeMessage('start_game')
  async onStartGame(
    @MessageBody() payload: StartGamePayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = await this.roomService.findById(payload.roomId);
      if (room.hostId !== payload.userId) {
        return client.emit('error', { message: 'Only the host can start the game' });
      }
      if (room.status !== 'waiting' as any) {
        return client.emit('error', { message: 'Game already started' });
      }

      await this.roomService.setRoomInProgress(payload.roomId);
      answeredTracker.set(payload.roomId, new Set());
      this.clearQuestionTimer(payload.roomId);

      this.server.to(payload.roomId).emit('game_starting', { countdown: 3 });

      setTimeout(async () => {
        const question = await this.roomService.getQuestion(payload.roomId, 0);
        if (!question) return;
        this.server.to(payload.roomId).emit('question', question);
        const freshRoom = await this.roomService.findById(payload.roomId);
        this.server.to(payload.roomId).emit('answer_progress', {
          answered: 0,
          total: freshRoom.roomPlayers.length,
        });
        this.startQuestionTimer(payload.roomId, 0, room.timerSeconds);
      }, 3000);
    } catch (err) {
      client.emit('error', { message: (err as Error).message });
    }
  }

  @SubscribeMessage('rematch')
  async onRematch(
    @MessageBody() payload: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = await this.roomService.resetRoom(payload.roomId, payload.userId);

      answeredTracker.delete(payload.roomId);
      this.clearQuestionTimer(payload.roomId);

      const sanitized = this.sanitizeRoom(room);

      this.server.to(payload.roomId).emit('room_updated', sanitized);
      this.server.to(payload.roomId).emit('rematch_started', { room: sanitized });
    } catch (err) {
      client.emit('error', { message: (err as Error).message });
    }
  }

  @SubscribeMessage('submit_answer')
  async onSubmitAnswer(
    @MessageBody() payload: SubmitAnswerPayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const result = await this.roomService.submitAnswer(
        payload.roomId, payload.userId, payload.questionIndex,
        payload.selectedAnswerIds, payload.timeSpentMs,
      );

      client.emit('answer_result', {
        questionIndex: payload.questionIndex,
        isCorrect: result.isCorrect,
        correctAnswerIds: result.correctAnswerIds,
        questionText: result.questionText,
        allAnswers: result.allAnswers,
      });

      const tracker = answeredTracker.get(payload.roomId) ?? new Set<string>();
      tracker.add(payload.userId);
      answeredTracker.set(payload.roomId, tracker);

      const room = await this.roomService.findById(payload.roomId);
      const totalPlayers = room.roomPlayers.length;

      this.server.to(payload.roomId).emit('answer_progress', {
        answered: tracker.size,
        total: totalPlayers,
      });

      const players = room.roomPlayers.map((p) => ({
        userId: p.user.id,
        username: p.user.username,
        score: p.score,
        correctAnswersCount: p.correctAnswersCount,
        isHost: p.isHost,
      }));
      this.server.to(payload.roomId).emit('leaderboard_update', players);

      if (tracker.size >= totalPlayers) {
        this.clearQuestionTimer(payload.roomId);
        // Don't auto-advance - let the host manually advance
      }
    } catch (err) {
      client.emit('error', { message: (err as Error).message });
    }
  }

  @SubscribeMessage('next_question')
  async onNextQuestion(
    @MessageBody() payload: NextQuestionPayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = await this.roomService.findById(payload.roomId);
      if (room.hostId !== payload.userId) {
        return client.emit('error', { message: 'Only the host can advance questions' });
      }
      this.clearQuestionTimer(payload.roomId);
      await this.advanceToNext(payload.roomId, room.currentQuestionIndex);
    } catch (err) {
      client.emit('error', { message: (err as Error).message });
    }
  }

  @SubscribeMessage('leave_room')
  async onLeaveRoom(
    @MessageBody() payload: LeaveRoomPayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = await this.roomService.findById(payload.roomId);

      if (room.hostId === payload.userId) {
        await this.roomService.deleteRoom(payload.roomId, payload.userId);
        this.clearQuestionTimer(payload.roomId);
        answeredTracker.delete(payload.roomId);
        client.leave(payload.roomId);
        socketRoom.delete(client.id);
        this.server.to(payload.roomId).emit('room_deleted', { reason: 'Host left the room' });
        client.emit('left_room', { success: true });
        return;
      }

      await this.roomService.removePlayer(payload.roomId, payload.userId);
      client.leave(payload.roomId);
      socketRoom.delete(client.id);

      this.server.to(payload.roomId).emit('player_left', { userId: payload.userId });
      const updatedRoom = await this.roomService.findById(payload.roomId);
      this.server.to(payload.roomId).emit('room_updated', this.sanitizeRoom(updatedRoom));
      client.emit('left_room', { success: true });
    } catch (err) {
      client.emit('error', { message: (err as Error).message });
    }
  }

  private async advanceToNext(roomId: string, currentIndex: number) {
    const nextIndex = await this.roomService.advanceQuestion(roomId);
    const question = await this.roomService.getQuestion(roomId, nextIndex);

    answeredTracker.set(roomId, new Set());
    this.clearQuestionTimer(roomId);

    if (!question) {
      const finalPlayers = await this.roomService.finalizeRoom(roomId);
      const leaderboard = finalPlayers.map((p) => ({
        rank: p.rank,
        userId: p.user.id,
        username: p.user.username,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        score: p.score,
        correctAnswersCount: p.correctAnswersCount,
        totalTimeMs: p.time,
      }));
      this.server.to(roomId).emit('game_over', { leaderboard });
      answeredTracker.delete(roomId);
    } else {
      this.server.to(roomId).emit('question', question);
      const room = await this.roomService.findById(roomId);
      const totalPlayers = (await this.roomService.findById(roomId)).roomPlayers.length;
      this.server.to(roomId).emit('answer_progress', { answered: 0, total: totalPlayers });
      this.startQuestionTimer(roomId, nextIndex, room.timerSeconds);
    }
  }

  private startQuestionTimer(roomId: string, questionIndex: number, timerSeconds: number) {
    this.clearQuestionTimer(roomId);
    // Don't start timer if timerSeconds is 0 (no time limit)
    if (timerSeconds <= 0) return;

    const timeout = setTimeout(async () => {
      // Check if we're still on the same question before emitting time_up
      try {
        const room = await this.roomService.findById(roomId);
        if (room.currentQuestionIndex === questionIndex) {
          this.server.to(roomId).emit('time_up', { questionIndex });
          // Don't auto-advance - let the host manually advance
        }
      } catch (err) {
        this.logger.error('Error in timer handler:', err);
      }
    }, timerSeconds * 1000);

    questionTimers.set(roomId, timeout);
  }

  private clearQuestionTimer(roomId: string) {
    const t = questionTimers.get(roomId);
    if (t) {
      clearTimeout(t);
      questionTimers.delete(roomId);
    }
  }

  private sanitizeRoom(room: any) {
    return {
      id: room.id,
      code: room.code,
      mode: room.mode,
      status: room.status,
      qcmCount: room.qcmCount,
      timerSeconds: room.timerSeconds,
      hostId: room.hostId,
      currentQuestionIndex: room.currentQuestionIndex,
      players: (room.roomPlayers ?? []).map((p: any) => ({
        id: p.id,
        userId: p.user?.id,
        username: p.user?.username,
        firstName: p.user?.firstName,
        lastName: p.user?.lastName,
        score: p.score,
        correctAnswersCount: p.correctAnswersCount,
        isHost: p.isHost,
        isReady: p.isReady,
        status: p.status,
        rank: p.rank,
      })),
    };
  }
}