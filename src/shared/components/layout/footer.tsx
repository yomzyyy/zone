import { APP_NAME } from "@/shared/constants";

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-4 text-center text-sm text-muted-foreground">
      &copy; {new Date().getFullYear()} {APP_NAME}
    </footer>
  );
}
