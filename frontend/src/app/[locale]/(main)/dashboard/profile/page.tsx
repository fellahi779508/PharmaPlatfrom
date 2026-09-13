import ProfileComponents from "@/components/dashboard/profile/profile.components";
import { requireAuth } from "@/utils/server/protectedRoutes";

export default async function Profile() {
  await requireAuth();
  return <ProfileComponents />;
}
