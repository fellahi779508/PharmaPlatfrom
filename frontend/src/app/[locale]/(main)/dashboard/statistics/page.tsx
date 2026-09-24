import StatisticsComponentPage from "@/components/dashboard/statistics/statistics.component";
import SubscriptionBlocker from "@/components/subscription/subscription-blocker.component";
import { isActivedRoute, requireAuth } from "@/utils/server/protectedRoutes";

export default async function StatisticsPage() {
    await requireAuth();
    const check = await isActivedRoute();
    return <>{check ? <StatisticsComponentPage /> : <SubscriptionBlocker />}</>;
}