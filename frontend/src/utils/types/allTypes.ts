/* ------------------------------------------------------------------ */
/* Entity Types (matching backend entities)                           */
/* ------------------------------------------------------------------ */

export type Year = {
  id: number;
  name: string;
  semesters?: Semester[];
  subjects?: Subject[];
};

export type Semester = {
  id: number;
  number: number;
  yearId?: number;
  year?: Year;
  courses?: Course[];
};

export type Subject = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  yearId?: number;
  year?: Year;
  courses?: Course[];
  tds?: Td[];
  tps?: Tp[];
};

export type Course = {
  id: number;
  name: string;
  subjectId?: number;
  subject?: Subject;
  semesterId?: number;
  semester?: Semester;
  qcms?: Qcm[];
};

export type CourseWithQcmCount = Course & {
  qcmCount?: number;
};

export type Qcm = {
  id: number;
  question: string;
  courseId?: number;
  course?: Course;
  tdId?: number;
  td?: Td;
  tpId?: number;
  tp?: Tp;
  answers?: QcmAnswer[];
};

export type QcmAnswer = {
  id: number;
  answer: string;
  isCorrect: boolean;
  explanation?: string;
  qcmId?: number;
  qcm?: Qcm;
};

export type Td = {
  id: number;
  name: string;
  subjectId?: number;
  subject?: Subject;
  qcms?: Qcm[];
};

export type TdWithQcmCount = Td & {
  qcmCount?: number;
};

export type Tp = {
  id: number;
  name: string;
  subjectId?: number;
  subject?: Subject;
  qcms?: Qcm[];
};

export type TpWithQcmCount = Tp & {
  qcmCount?: number;
};

export type Exam = {
  id: number;
  duration: number;
};

export type RedeemCode = {
  id: number;
  code: string;
  isActivated: boolean;
  activationDate?: string;
  expiryDate?: string;
  year?: Year;
  user?: User | null;
};

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  email: string;
  password?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  activationDate?: string;
  endDate?: string;
  role: string;
  isVerified: boolean;
  otpCode?: string | null;
  otpExpiresAt?: string | null;
  aiGenerationCount?: number;
};

/* ------------------------------------------------------------------ */
/* Create DTO Types (matching backend create DTOs)                     */
/* ------------------------------------------------------------------ */

export type CreateYear = {
  name: string;
};

export type CreateSemester = {
  number: number;
  yearId: number;
};

export type CreateSubject = {
  name: string;
  yearId: number;
};

export type CreateCourse = {
  name: string;
  subjectId: number;
  semesterId: number;
};

export type CreateQcm = {
  question: string;
  courseId?: number;
  tdId?: number;
  tpId?: number;
  answers: CreateQcmAnswer[];
};

export type CreateQcmAnswer = {
  answer: string;
  isCorrect: boolean;
  explanation?: string;
};

export type CreateTd = {
  name: string;
  subjectId: number;
};

export type CreateTp = {
  name: string;
  subjectId: number;
};

export type CreateExam = {
  duration: number;
};

export type CreateRedeemCode = {
  yearId?: number;
};

export type CreateUser = {
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  email: string;
  password: string;
  role: string;

};

type FlashcardKind = 'qcm' | 'medicament';

interface FlashcardAnswer {
  id: number;
  answer: string;
  isCorrect: boolean;
  explanation: string | null;
}

interface QcmData {
  id: number;
  question: string;
  answers: FlashcardAnswer[];
  course: { id: number; name: string } | null;
  td: { id: number; name: string } | null;
  tp: { id: number; name: string } | null;
}

interface MedicamentData {
  id: number;
  name: string;
  dci: string | null;
  therapeuticClass: string | null;
  form: string | null;
  dosage: string | null;
  indication: string | null;
  contraindications: string | null;
  sideEffects: string | null;
  posology: string | null;
  notes: string | null;
  image: { id: number; url: string; width: number; height: number } | null;
}

interface FlashcardData {
  id: number;
  date: string;
  kind: FlashcardKind;
  semesterNumber: number | null;
  year: { id: number; name: string } | null;
  qcm?: QcmData;
  medicament?: MedicamentData;
}

export type CreateTodo = {
  title: string;
  description: string;
  status: string;
};
export type Todo = {
  id: number;
  title: string;
  description: string;
  status: string;
  tasks?: Task[];
};

export type Task = {
  id: number;
  title: string;
  description: string;
  priority: string;
  startDate?: Date;
  startTime?: Date;
  isFinished: boolean;
};
export type CreateTask = {
  title: string;
  description: string;
  priority: string;
  startDate?: Date;
  startTime?: Date;
  isFinished: boolean;
  todoId: number;
};

/* ------------------------------------------------------------------ */
/* Update DTO Types (for partial updates)                              */
/* ------------------------------------------------------------------ */
export type UpdateTodo = Partial<CreateTodo>;

export type UpdateTask = Partial<CreateTask>;

export type UpdateYear = Partial<CreateYear>;

export type UpdateSemester = Partial<CreateSemester>;

export type UpdateSubject = Partial<CreateSubject>;

export type UpdateCourse = Partial<CreateCourse>;

export type UpdateQcm = Partial<CreateQcm>;

export type UpdateQcmAnswer = Partial<CreateQcmAnswer>;

export type UpdateTd = Partial<CreateTd>;

export type UpdateTp = Partial<CreateTp>;

export type UpdateExam = Partial<CreateExam>;

export type UpdateRedeemCode = Partial<CreateRedeemCode>;

export type UpdateUser = Partial<CreateUser>;

/* ------------------------------------------------------------------ */
/* Session Related Types                                              */
/* ------------------------------------------------------------------ */

export type Session = {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  qcms?: Qcm[];
};

export type CreateSession = {
  name: string;
  courseIds: {
    id: number;
    qcmQte: number;
  }[];
};

export type UpdateSession = Partial<CreateSession>;

export type UserSession = {
  id: number;
  isCompleted: boolean;
  score?: number;
  startedAt: Date;
  user?: User;
  session?: Session;
  userAnswers?: UserQcmAnswer[];
};

export type UserQcmAnswer = {
  id: number;
  isCorrect: boolean;
  userSession?: UserSession;
  qcm?: Qcm;
  selectedAnswer?: QcmAnswer;
};

export type SessionStartResponse = {
  status: boolean;
  response: {
    userSessionId: number;
    sessionName: string;
    qcms: Qcm[];
  };
};

export type AnswerSubmitResponse = {
  status: boolean;
  isCorrect: boolean;
  explanation?: string;
};

export type SessionProgressResponse = {
  status: boolean;
  response: {
    isCompleted: boolean;
    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers: number;
    score: number;
    userAnswers: UserQcmAnswer[];
  };
};
export type UserStats = {
  sessions: number;
  sessionsDone: number;
  sessionsNotStarted: number;
  sessionsInProgress: number;
  exams: number;
  examsDone: number;
  examsInProgress: number;
  examsPaused: number;
  correctAnswers: number;
  wrongAnswers: number;
  allQuestions: number;
};

export type AdminUserStats = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalRedeemCodes: number;
  activeRedeemCodes: number;
  usedRedeemCodes: number;
};
