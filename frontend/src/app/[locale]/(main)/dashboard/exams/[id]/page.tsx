import SubscriptionBlocker from "@/components/subscription/subscription-blocker.component";
import ExamSessionComponent from "./exam-session.component";
import { isActivedRoute, requireAuth } from "@/utils/server/protectedRoutes";


export default async function ExamSessionPage() {
    await requireAuth();
    const check = await isActivedRoute();
    return check ? <ExamSessionComponent /> : <SubscriptionBlocker />;
}