export type Subject = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
  yearId?: number;
};

export type CreateSubject = {
  name: string;
  yearId: number;
  isDemo?: boolean;
};
