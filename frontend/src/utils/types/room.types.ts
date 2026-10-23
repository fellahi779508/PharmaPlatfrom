// -----------------------------------------------------------------------------
// Room Types - matches backend room entity
// -----------------------------------------------------------------------------

export type RoomStatus = "waiting" | "in_progress" | "completed";

export type RoomMode = "exam_simulation" | "qcm_speed_run";

export type Room = {
  id: string;
  code: string;
  mode: RoomMode;
  status: RoomStatus;
  qcmCount: number;
  timerSeconds: number;
  currentQuestionIndex: number;
  hostId: string | null;
  qcmIds: number[] | null;
  createdAt: Date;
  updatedAt: Date;
  session?: {
    id: number;
    name?: string;
  } | null;
  exam?: {
    id: number;
    title?: string;
  } | null;
  roomPlayers?: RoomPlayer[];
};

export type RoomPlayer = {
  id: string;
  userId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  score: number;
  time: number;
  rank: number;
  isHost: boolean;
  isReady: boolean;
  status: string;
  correctAnswersCount: number;
};

// -----------------------------------------------------------------------------
// Create Room DTO
// -----------------------------------------------------------------------------
export type ContentSelection = {
  subjectId: number;
  semesterId?: number;
  courseIds?: number[];
  tdIds?: number[];
  tpIds?: number[];
};

export type CreateRoomDto = {
  mode: RoomMode;
  qcmCount: number;
  timerSeconds: number;
  content: ContentSelection;
};

// -----------------------------------------------------------------------------
// Question data for gameplay
// -----------------------------------------------------------------------------
export type RoomQuestion = {
  questionIndex: number;
  totalQuestions: number;
  timerSeconds: number;
  qcm: {
    id: number;
    question: string;
    image: {
      id: number;
      url: string;
    } | null;
    answers: {
      id: number;
      answer: string;
    }[];
  };
};

// -----------------------------------------------------------------------------
// Leaderboard entry
// -----------------------------------------------------------------------------
export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  score: number;
  correctAnswersCount: number;
  totalTimeMs: number;
};

// -----------------------------------------------------------------------------
// API Response wrapper
// -----------------------------------------------------------------------------
export type ApiResponse<T> = {
  status: boolean;
  response?: T;
  message?: string;
};
