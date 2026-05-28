import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { AuthProvider } from "@/modules/auth/components/auth-provider";
import { BoardProvider } from "@/modules/tasks/components/board-provider";
import { SessionsProvider } from "@/modules/timer/components/sessions-provider";
import { ActiveTimerChip } from "@/modules/timer/components/active-timer-chip";
import { Footer } from "@/shared/components/layout/footer";
import { Toaster } from "@/shared/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zone — Flow Timer & Task Manager",
  description: "Beat procrastination. Track your flow. Get things done.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <BoardProvider>
              <SessionsProvider>
              <div className="flex h-dvh flex-col">
                <main className="flex flex-1 flex-col overflow-hidden">
                  {children}
                </main>
                <Footer />
              </div>
              <ActiveTimerChip />
              <Toaster />
              </SessionsProvider>
            </BoardProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
