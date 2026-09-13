"use server";
import TeacherPageComponent from "@/components/teacher/teacher.component";
import { TeacherRoute } from "@/utils/server/protectedRoutes";

export default async function Teacher() {
  await TeacherRoute();
  return <TeacherPageComponent />;
}
