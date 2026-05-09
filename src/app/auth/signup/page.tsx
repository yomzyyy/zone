import Link from "next/link";
import { SignUpForm } from "@/modules/auth/components/signup-form";
import { BackToHome } from "@/modules/auth/components/back-to-home";
import { AUTH_ROUTES } from "@/modules/auth/constants";
import { APP_NAME } from "@/shared/constants";

export default function SignUpPage() {
  return (
    <div className="relative flex flex-1 items-center justify-center px-4 py-12">
      <BackToHome />
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Create your {APP_NAME} account</h1>
          <p className="text-muted-foreground text-sm">
            Start tracking your flow and get things done
          </p>
        </div>

        <SignUpForm />

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={AUTH_ROUTES.LOGIN}
            className="underline hover:text-foreground"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
