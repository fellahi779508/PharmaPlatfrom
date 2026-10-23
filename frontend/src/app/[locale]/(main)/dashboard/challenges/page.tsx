import ChallengesComponent from "@/components/dashboard/challenges/challenges.component";
import SubscriptionBlocker from "@/components/subscription/subscription-blocker.component";
import { isActivedRoute, requireAuth } from "@/utils/server/protectedRoutes";

export default async function ChallengesPage() {
  await requireAuth();
  const check = await isActivedRoute();

  return (
    <>
      {check ? <ChallengesComponent /> : <SubscriptionBlocker />}
    </>
  );
}
