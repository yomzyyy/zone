import { VerifyForm } from "@/modules/auth/components/verify-form";
import { BackToHome } from "@/modules/auth/components/back-to-home";

export default function VerifyPage() {
  return (
    <div className="relative flex flex-1 items-center justify-center px-4 py-12">
      <BackToHome />
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Verify your email</h1>
          <p className="text-muted-foreground text-sm">
            We sent a 6-digit code to your email.
            <br />
            Check your inbox and enter it below.
          </p>
        </div>

        <VerifyForm />
      </div>
    </div>
  );
}
