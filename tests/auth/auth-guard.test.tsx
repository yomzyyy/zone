import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthGuard } from "@/modules/auth/components/auth-guard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("AuthGuard", () => {
  it("shows children when authenticated", () => {
    render(
      <AuthGuard feature="Tasks" isAuthenticated>
        <p>Task content</p>
      </AuthGuard>,
    );
    expect(screen.getByText("Task content")).toBeInTheDocument();
  });

  it("shows login prompt when not authenticated", () => {
    render(
      <AuthGuard feature="Tasks" isAuthenticated={false}>
        <p>Task content</p>
      </AuthGuard>,
    );
    expect(screen.queryByText("Task content")).not.toBeInTheDocument();
    expect(screen.getByText("Log in to access Tasks")).toBeInTheDocument();
  });

  it("shows sign up and log in buttons for guests", () => {
    render(
      <AuthGuard feature="Calendar" isAuthenticated={false}>
        <p>Calendar content</p>
      </AuthGuard>,
    );
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i }),
    ).toBeInTheDocument();
  });
});
