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

export type Tp = {
  id: number;
  name: string;
  subjectId?: number;
  subject?: Subject;
  qcms?: Qcm[];
};

export type Exam = {
  id: number;
  duration: number;
};

export type RedeemCode = {
  id: string;
};

export type User = {
  id: string;
  username: string;
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

export type CreateRedeemCode = Record<string, never>;

export type CreateUser = {
  username: string;
  email: string;
  password: string;
  role: string;
};

/* ------------------------------------------------------------------ */
/* Update DTO Types (for partial updates)                              */
/* ------------------------------------------------------------------ */

export type UpdateYear = Partial<CreateYear>;

export type UpdateSemester = Partial<CreateSemester>;

export type UpdateSubject = Partial<CreateSubject>;

export type UpdateCourse = Partial<CreateCourse>;

export type UpdateQcm = Partial<CreateQcm>;

export type UpdateQcmAnswer = Partial<CreateQcmAnswer>;

export type UpdateTd = Partial<CreateTd>;

export type UpdateTp = Partial<CreateTp>;

export type UpdateExam = Partial<CreateExam>;

export type UpdateRedeemCode = Record<string, never>;

export type UpdateUser = Partial<CreateUser>;
