import MindmapComponent from "@/components/dashboard/mindmaps/mindmap.component";
import SubscriptionBlocker from "@/components/subscription/subscription-blocker.component";
import { isActivedRoute, requireAuth } from "@/utils/server/protectedRoutes";

export default async function MindmapPage() {
    await requireAuth();
    const check = await isActivedRoute();
    return <>{check ? <MindmapComponent /> : <SubscriptionBlocker />}</>;
}