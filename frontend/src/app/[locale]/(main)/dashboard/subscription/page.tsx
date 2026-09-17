
import SubscriptionComponent from "@/components/dashboard/subscription/subscription.component";
import { requireAuth } from "@/utils/server/protectedRoutes";

export default async function SubscriptionPage() {
    await requireAuth();
    return (
        <SubscriptionComponent />
    )
}