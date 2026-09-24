import { AdminRoute } from "@/utils/server/protectedRoutes";
import AdminComponent from "@/components/admin/admin.component";

export default async function Admin() {
  await AdminRoute();
  return <AdminComponent />;
}
