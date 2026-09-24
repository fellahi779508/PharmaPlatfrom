import PomodoroComponent from "@/components/dashboard/pomodoro/pomodoro.component";
import SubscriptionBlocker from "@/components/subscription/subscription-blocker.component";
import { isActivedRoute, requireAuth } from "@/utils/server/protectedRoutes";

export default async function PomodoroPage() {
    await requireAuth();
    const check = await isActivedRoute();
    return <>{check ? <PomodoroComponent /> : <SubscriptionBlocker />}</>;
}