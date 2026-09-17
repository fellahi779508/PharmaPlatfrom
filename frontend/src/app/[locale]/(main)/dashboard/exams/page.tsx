import ExamsComponent from "@/components/dashboard/exam/exam.component";
import SubscriptionBlocker from "@/components/subscription/subscription-blocker.component";
import { isActivedRoute, requireAuth } from "@/utils/server/protectedRoutes";

export default async function ExamsPage() {
    await requireAuth();
    const check = await isActivedRoute();
    return <>
        {check ? <ExamsComponent /> : <SubscriptionBlocker />}
    </>
}