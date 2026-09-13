import DashboardPageComponent from "@/components/dashboard/dashboard.component";
import { requireAuth } from "@/utils/server/protectedRoutes";

export default async function DashboardPage() {
  await requireAuth();
  return <DashboardPageComponent />;
}
