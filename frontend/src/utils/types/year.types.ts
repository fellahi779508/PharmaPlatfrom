import { Semester } from "./semester.types";

export type Year = {
  id: number;
  name: string;
  isDemo?: boolean;
  semeters: Semester[];
};

export type CreateYearRequest = {
  name: string;
  isDemo?: boolean;
};
