export type Course = {
  id: number;
  name: string;
  subjectId?: number;
  semesterId?: number;
};

export type CreateCourse = {
  name: string;
  subjectId: number;
  semesterId: number;
};
