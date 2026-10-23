export type Qcm = {
  id: number;
  question: string;
  isDemo?: boolean;
  courseId?: number;
  tdId?: number;
  tpId?: number;
};

export type CreateQcm = {
  question: string;
  courseId: number;
  tdId?: number;
  tpId?: number;
  isDemo?: boolean;
  answers?: QcmAnswer[];
};

export type QcmAnswer = {
  id?: number;
  answer: string;
  isCorrect: boolean;
  explanation?: string;
};
