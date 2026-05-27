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
    <header className="relative flex items-center justify-between gap-2 px-3 py-3 sm:px-6 sm:py-4">
      {/* Logo — wordmark hidden on small screens to avoid colliding with tabs */}
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xl font-bold">[Z]</span>
        <span className="hidden text-lg font-semibold sm:inline">
          {APP_NAME}
        </span>
      </div>

      {/* Center tabs — absolutely positioned at sm+ so they're truly centered.
          On mobile they sit inline (after the logo) so the row can flow. */}
      <div className="flex flex-1 justify-center sm:absolute sm:left-1/2 sm:flex-none sm:-translate-x-1/2">
        <NavTabs activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      {/* Profile */}
      <ProfileDropdown />
    </header>
  );
}
