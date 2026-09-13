export type Qcm = {
  id: number;
  question: string;
  courseId?: number;
  tdId?: number;
  tpId?: number;
};

export type CreateQcm = {
  question: string;
  courseId: number;
  tdId?: number;
  tpId?: number;
  answers?: QcmAnswer[];
};

export type QcmAnswer = {
  id?: number;
  answer: string;
  isCorrect: boolean;
  explanation?: string;
};
