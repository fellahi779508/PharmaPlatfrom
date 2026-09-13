import { Semester } from "./semester.types";

export type Year = {
  id: number;
  name: string;
  semeters: Semester[];
};

export type CreateYearRequest = {
  name: string;
};
