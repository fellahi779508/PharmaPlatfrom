"use server";

import RegisterComponent from "@/components/register/register.component";
import { redirectIfLoggedIn } from "@/utils/server/protectedRoutes";

export default async function RegitserPage() {
  return <RegisterComponent />;
}
