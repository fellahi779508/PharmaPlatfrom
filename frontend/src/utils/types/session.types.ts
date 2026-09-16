// -----------------------------------------------------------------------------
// User (kept as-is for compatibility)
// -----------------------------------------------------------------------------
export type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  activationDate?: Date;
  endDate?: Date;
  role: string;
  isVerified: boolean;
};

// -----------------------------------------------------------------------------
// Session
// -----------------------------------------------------------------------------
export type SessionStatus = "not_started" | "in_progress" | "completed";

export type Session = {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  status: SessionStatus;
  currentQuestionId: number | null;
  totalQuestions: number;
  correctCount: number;
  user?: User;
};

// -----------------------------------------------------------------------------
// Create / Update DTOs — matches the new backend payload
// -----------------------------------------------------------------------------
export type CreateSession = {
  name: string;
  subjects: {
    subjectId: number;
    courses: {
      courseId: number;
      qcmQte: number;
    }[];
    tds: {
      tdId: number;
      qcmQte: number;
    }[];
    tps: {
      tpId: number;
      qcmQte: number;
    }[];
  }[];
};

export type UpdateSession = Partial<CreateSession>;

// -----------------------------------------------------------------------------
// Play state (returned by /session/:id/play, /reveal, /next)
// -----------------------------------------------------------------------------
export type SessionAnswer = {
  id: number;
  answer: string;
  /** Only present after reveal */
  isCorrect?: boolean;
  /** Only present after reveal */
  explanation?: string | null;
  /** Only present after reveal */
  selected?: boolean;
};

export type SessionQuestion = {
  id: number;
  position: number;
  question: string;
  isAnswered: boolean;
  isRevealed: boolean;
  isCorrect: boolean | null;
  selectedAnswerIds: number[];
  answers: SessionAnswer[];
};

export type SessionPlaySession = {
  id: number;
  name: string;
  status: SessionStatus;
  totalQuestions: number;
  correctCount: number;
  currentPosition?: number;
};

export type SessionPlayState = {
  completed: boolean;
  session: SessionPlaySession;
  question?: SessionQuestion;
};

// -----------------------------------------------------------------------------
// API wrappers
// -----------------------------------------------------------------------------
export type ApiResponse<T> = {
  status: boolean;
  response?: T;
  message?: string;
};

export type RevealResponse = {
  status: boolean;
  result: SessionPlayState;
  message?: string;
};

// -----------------------------------------------------------------------------
// Kept for compatibility (used elsewhere in your app)
// -----------------------------------------------------------------------------
export type Qcm = {
  id: number;
  question: string;
  courseId?: number;
  tdId?: number;
  tpId?: number;
  answers?: QcmAnswer[];
};

export type QcmAnswer = {
  id: number;
  answer: string;
  isCorrect: boolean;
  explanation?: string;
  qcmId?: number;
};
