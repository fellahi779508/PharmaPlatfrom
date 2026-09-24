import TodoPageComponent from "@/components/dashboard/todo/todo.component";
import SubscriptionBlocker from "@/components/subscription/subscription-blocker.component";
import { isActivedRoute, requireAuth } from "@/utils/server/protectedRoutes";

export default async function TodoPage() {
  await requireAuth();
  const check = await isActivedRoute();
  return <>{check ? <TodoPageComponent /> : <SubscriptionBlocker />}</>;
}
