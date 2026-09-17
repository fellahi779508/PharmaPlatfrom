import SessionComponent from "@/components/dashboard/session/session.component";
import SubscriptionBlocker from "@/components/subscription/subscription-blocker.component";
import { isActivedRoute, requireAuth } from "@/utils/server/protectedRoutes";

export default async function SessionsPage() {
  await requireAuth();
  const check = await isActivedRoute();

  return (
    <>
      {check ? <SessionComponent /> : <SubscriptionBlocker />}
    </>
  );
}