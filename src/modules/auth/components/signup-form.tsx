"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/shared/lib/supabase/client";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  AUTH_ROUTES,
  AUTH_STORAGE_KEYS,
  PASSWORD_MIN_LENGTH,
} from "../constants";
import {
  validateEmail,
  validateName,
  validatePassword,
} from "../utils/validation";

export function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const errors = {
    name: validateName(name),
    email: validateEmail(email),
    password: validatePassword(password),
  };
  const showError = (field: keyof typeof errors) =>
    submitted && Boolean(errors[field]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);

    if (errors.name || errors.email || errors.password) return;

    setIsSubmitting(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      setIsSubmitting(false);
      toast.error(error.message);
      return;
    }

    localStorage.setItem(AUTH_STORAGE_KEYS.PENDING_EMAIL, email);
    localStorage.setItem(AUTH_STORAGE_KEYS.PENDING_NAME, name);

    setIsSubmitting(false);
    router.push(AUTH_ROUTES.VERIFY);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={showError("name")}
          aria-describedby={showError("name") ? "name-error" : undefined}
        />
        {showError("name") && (
          <p id="name-error" className="text-xs text-destructive">
            {errors.name}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={showError("email")}
          aria-describedby={showError("email") ? "email-error" : undefined}
        />
        {showError("email") && (
          <p id="email-error" className="text-xs text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={showError("password")}
          aria-describedby={showError("password") ? "password-error" : undefined}
        />
        {showError("password") && (
          <p id="password-error" className="text-xs text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Sign Up"}
      </Button>
    </form>
  );
}
