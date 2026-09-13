"use server";
import { AdminRoute } from "@/utils/server/protectedRoutes";

export default async function Admin() {
  await AdminRoute();
  return <div>Admin</div>;
}
