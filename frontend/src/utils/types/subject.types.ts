export type Subject = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  yearId?: number;
};

export type CreateSubject = {
  name: string;
  yearId: number;
};
