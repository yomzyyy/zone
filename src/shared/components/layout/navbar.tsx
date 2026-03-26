import { APP_NAME, type TabId } from "@/shared/constants";
import { NavTabs } from "./nav-tabs";
import { ProfileDropdown } from "./profile-dropdown";

interface NavbarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

// The top navigation bar — present on every page.
// Three sections: logo (left), tabs (center), profile (right).
export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  return (
    <header className="relative flex items-center justify-between px-6 py-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold">[Z]</span>
        <span className="text-lg font-semibold">{APP_NAME}</span>
      </div>

      {/* Center tabs — absolutely positioned so they're truly centered on the page */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <NavTabs activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      {/* Profile */}
      <ProfileDropdown />
    </header>
  );
}
