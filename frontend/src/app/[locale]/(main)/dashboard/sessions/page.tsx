import SessionComponent from "@/components/dashboard/session/session.component";
import { requireAuth } from "@/utils/server/protectedRoutes";

export default async function SessionsPage() {
  await requireAuth();
  return <SessionComponent />;
}
