import TodoPageComponent from "@/components/dashboard/todo/todo.component";
import { requireAuth } from "@/utils/server/protectedRoutes";

export default async function TodoPage() {
  await requireAuth();
  return <TodoPageComponent />;
}
