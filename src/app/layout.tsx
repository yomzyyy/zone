import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/shared/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zone — Flow Timer & Task Manager",
  description: "Beat procrastination. Track your flow. Get things done.",
};

// This is the ROOT layout — it wraps every single page in your app.
// Think of it as the <html> skeleton. The {children} is whatever page you're on.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode; // ReactNode = any valid JSX content (elements, strings, etc.)
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
