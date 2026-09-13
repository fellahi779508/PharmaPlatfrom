import LoginPageComponent from "@/components/login/login.page";
import { redirectIfLoggedIn } from "@/utils/server/protectedRoutes";

export default async function LoginPage() {
  await redirectIfLoggedIn();
  return (
    <div>
      <LoginPageComponent />
    </div>
  );
}
