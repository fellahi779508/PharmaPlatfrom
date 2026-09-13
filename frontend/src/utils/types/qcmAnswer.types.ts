export type QcmAnswer = {
  id: number;
  answer: string;
  isCorrect: boolean;
  explanation?: string;
  qcmId?: number;
};

export type CreateQcmAnswer = {
  answer: string;
  isCorrect: boolean;
  explanation?: string;
  qcmId: number;
};
