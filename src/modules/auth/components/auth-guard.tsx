"use client";

import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { AUTH_ROUTES } from "../constants";

interface AuthGuardProps {
  feature: string;
  children: React.ReactNode;
  isAuthenticated: boolean;
}

export function AuthGuard({
  feature,
  children,
  isAuthenticated,
}: AuthGuardProps) {
  const router = useRouter();

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
      <LogIn className="h-12 w-12 text-muted-foreground" />
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold">Log in to access {feature}</h2>
        <p className="text-sm text-muted-foreground">
          Create a free account to unlock all features
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => router.push(AUTH_ROUTES.LOGIN)}
        >
          Log in
        </Button>
        <Button onClick={() => router.push(AUTH_ROUTES.SIGNUP)}>Sign up</Button>
      </div>
    </div>
  );
}
