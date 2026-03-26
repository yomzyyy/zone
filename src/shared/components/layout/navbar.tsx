import { APP_NAME } from "@/shared/constants";
import { NavTabs } from "./nav-tabs";
import { ProfileDropdown } from "./profile-dropdown";

// The top navigation bar — present on every page.
// Three sections: logo (left), tabs (center), profile (right).
export function Navbar() {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold">[Z]</span>
        <span className="text-lg font-semibold">{APP_NAME}</span>
      </div>

      {/* Center tabs */}
      <NavTabs />

      {/* Profile */}
      <ProfileDropdown />
    </header>
  );
}
