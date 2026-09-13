export type Semester = {
  id: number;
  number: number;
  yearId?: number;
};
export type CreateSemester = {
  number: number;
  yearId: number;
};
