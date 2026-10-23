export type Course = {
  id: number;
  name: string;
  isDemo?: boolean;
  subjectId?: number;
  semesterId?: number;
};

export type CreateCourse = {
  name: string;
  subjectId: number;
  semesterId: number;
  isDemo?: boolean;
};
