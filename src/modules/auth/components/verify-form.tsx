"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/shared/lib/supabase/client";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { AUTH_STORAGE_KEYS, RESEND_COOLDOWN_SECONDS } from "../constants";

export function VerifyForm() {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEYS.PENDING_EMAIL) || "";
    setEmail(stored);
    inputRefs.current[0]?.focus();
  }, []);

  // Tick the cooldown countdown once a second. Source of truth is the
  // localStorage timestamp so refreshing the page can't bypass the cooldown.
  useEffect(() => {
    function recompute() {
      const until = Number(
        localStorage.getItem(AUTH_STORAGE_KEYS.RESEND_COOLDOWN_UNTIL) ?? 0,
      );
      const left = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setCooldownLeft(left);
    }
    recompute();
    const id = setInterval(recompute, 1000);
    return () => clearInterval(id);
  }, []);

  async function handleResend() {
    if (cooldownLeft > 0 || isResending) return;
    if (!email) {
      toast.error("No email on file. Please sign up again.");
      return;
    }
    setIsResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    setIsResending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const until = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
    localStorage.setItem(
      AUTH_STORAGE_KEYS.RESEND_COOLDOWN_UNTIL,
      String(until),
    );
    setCooldownLeft(RESEND_COOLDOWN_SECONDS);
    toast.success("Code resent. Check your inbox.");
  }

  function handleDigitChange(index: number, value: string) {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newDigits = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    const nextEmpty = newDigits.findIndex((d) => !d);
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");

    if (code.length !== 6) {
      toast.error("Please enter the full 6-digit code");
      return;
    }

    if (!email) {
      toast.error("No email on file. Please sign up again.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "signup",
    });

    if (error) {
      setIsSubmitting(false);
      toast.error(error.message);
      return;
    }

    const name = localStorage.getItem(AUTH_STORAGE_KEYS.PENDING_NAME) ?? "";
    localStorage.removeItem(AUTH_STORAGE_KEYS.PENDING_EMAIL);
    localStorage.removeItem(AUTH_STORAGE_KEYS.PENDING_NAME);

    // Best-effort welcome email — fire-and-forget so a Resend hiccup doesn't
    // block the user from entering the app.
    fetch("/api/auth/send-welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    }).catch(() => {});

    setIsSubmitting(false);
    toast.success("Email verified! Welcome to Zone.");
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {email && (
        <p className="text-center text-sm text-muted-foreground">
          Code sent to <span className="text-foreground">{email}</span>
        </p>
      )}

      <div className="flex w-full gap-2" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <Input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="h-14 w-0 min-w-0 flex-1 text-center text-2xl font-bold"
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Verifying..." : "Verify"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldownLeft > 0 || isResending}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:no-underline"
        >
          {cooldownLeft > 0
            ? `Resend code in ${cooldownLeft}s`
            : isResending
              ? "Sending..."
              : "Didn't receive it? Resend code"}
        </button>
      </div>
    </form>
  );
}
