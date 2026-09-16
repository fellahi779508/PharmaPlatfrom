export type ExamSessionStatus = "in_progress" | "paused" | "completed";

export interface Subject {
    id: number;
    name: string;
    year?: { id: number; name: string };
}

export interface Semester {
    id: number;
    number: number;
    year?: { id: number; name: string };
}

export interface Exam {
    id: number;
    title: string;
    questionCount: number;
    subject: { id: number; name: string };
    semester: { id: number; number: number };
    createdAt?: string;
    updatedAt?: string;
}

export interface ExamAnswerOption {
    id: number;
    answer: string;
    isCorrect?: boolean;
    explanation?: string;
}

export interface UserAnswerFeedback {
    selectedAnswerId: number | null;
    isCorrect: boolean;
    isSkipped: boolean;
    answeredAt?: string;
}

export interface ExamQuestion {
    order: number;
    qcmId: number;
    question: string;
    answers: ExamAnswerOption[];
    userAnswer?: UserAnswerFeedback | null;
}

export interface ExamSession {
    id: number;
    userId: number;
    status: ExamSessionStatus;
    currentQuestionIndex: number;
    score: number;
    totalTimeSpent: number;
    startedAt: string | null;
    lastActiveAt: string | null;
    pausedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    exam: Exam;
}

export interface ExamSessionProgress {
    sessionId: number;
    status: ExamSessionStatus;
    startedAt: string | null;
    pausedAt: string | null;
    completedAt: string | null;
    totalTimeSpent: number;
    currentQuestionIndex: number;
    score: number;
    totalQuestions: number;
    exam: Exam;
    questions: ExamQuestion[];
}

export interface ExamSessionResults extends ExamSessionProgress {
    percentage: number;
    correctCount: number;
    wrongCount: number;
    skippedCount: number;
    unansweredCount: number;
}

export interface GenerateExamPayload {
    subjectId: number;
    semesterId: number;
    questionCount?: number;
}

export interface SubmitAnswerPayload {
    qcmId: number;
    selectedAnswerId?: number | null;
    timeSpent?: number;
}

export interface SubmitAnswerResponse {
    qcmId: number;
    selectedAnswerId: number | null;
    isCorrect: boolean;
    isSkipped: boolean;
    correctAnswerId: number | null;
    explanation: string | null;
    currentQuestionIndex: number;
    score: number;
}

export interface ApiResult<T> {
    status: boolean;
    response?: T;
    message?: string;
}
// Add durationMinutes to Exam
export interface Exam {
    id: number;
    title: string;
    questionCount: number;
    durationMinutes: number;          // NEW
    subject: { id: number; name: string };
    semester: { id: number; number: number };
    createdAt?: string;
    updatedAt?: string;
}

// ExamSessionProgress — score & correctness become optional
export interface ExamSessionProgress {
    sessionId: number;
    status: ExamSessionStatus;
    startedAt: string | null;
    lastActiveAt: string | null;       // NEW
    pausedAt: string | null;
    completedAt: string | null;
    totalTimeSpent: number;
    currentQuestionIndex: number;
    score: number;
    totalQuestions: number;
    durationMinutes: number;           // NEW
    exam: Exam;
    questions: ExamQuestion[];
}

// UserAnswerFeedback — isCorrect optional
export interface UserAnswerFeedback {
    selectedAnswerId: number | null;
    isSkipped: boolean;
    answeredAt?: string;
    isCorrect: boolean;               // only present when completed
}

// SubmitAnswerResponse — no correctness anymore
export interface SubmitAnswerResponse {
    qcmId: number;
    selectedAnswerId: number | null;
    isSkipped: boolean;
    currentQuestionIndex: number;
}

// GenerateExamPayload — add durationMinutes
export interface GenerateExamPayload {
    subjectId: number;
    semesterId: number;
    questionCount?: number;
    durationMinutes?: number;          // NEW
}