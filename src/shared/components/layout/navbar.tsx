import { APP_NAME, type TabId } from "@/shared/constants";
import { NavTabs } from "./nav-tabs";
import { ProfileDropdown } from "./profile-dropdown";

interface NavbarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  return (
    <header className="relative flex items-center justify-between gap-2 px-3 py-3 sm:px-6 sm:py-4">
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xl font-bold">[Z]</span>
        <span className="hidden text-lg font-semibold sm:inline">
          {APP_NAME}
        </span>
      </div>

      <div className="flex flex-1 justify-center sm:absolute sm:left-1/2 sm:flex-none sm:-translate-x-1/2">
        <NavTabs activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      <ProfileDropdown />
    </header>
  );
}
