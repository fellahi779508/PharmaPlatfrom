import LeaderboardComponent from "@/components/dashboard/leaderboard/leaderboard.component";
import SubscriptionBlocker from "@/components/subscription/subscription-blocker.component";
import { isActivedRoute, requireAuth } from "@/utils/server/protectedRoutes";

export default async function LeaderboardPage() {
    await requireAuth();
    const check = await isActivedRoute();
    return <>{check ? <LeaderboardComponent /> : <SubscriptionBlocker />}</>;
}