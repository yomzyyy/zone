import Link from "next/link";
import { LoginForm } from "@/modules/auth/components/login-form";
import { BackToHome } from "@/modules/auth/components/back-to-home";
import { AUTH_ROUTES } from "@/modules/auth/constants";
import { APP_NAME } from "@/shared/constants";

export default function LoginPage() {
  return (
    <div className="relative flex flex-1 items-center justify-center px-4 py-12">
      <BackToHome />
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Welcome back to {APP_NAME}</h1>
          <p className="text-muted-foreground text-sm">
            Log in to continue your flow
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href={AUTH_ROUTES.SIGNUP}
            className="underline hover:text-foreground"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
