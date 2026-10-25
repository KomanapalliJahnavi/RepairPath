import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { MobileNav } from './MobileNav';

import { StorageDisclosureFooter } from './StorageDisclosureFooter';

interface AppShellProps {
  children: React.ReactNode;
  onOpenAddAppliance: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  onOpenAddAppliance,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F5F4EF] text-[#252923]">
      {/* Desktop Sidebar (fixed width, sticky, hidden on mobile) */}
      <Sidebar onOpenAddAppliance={onOpenAddAppliance} />

      {/* Mobile Drawer Navigation */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onOpenAddAppliance={onOpenAddAppliance}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          onToggleMobileNav={() => setMobileNavOpen(true)}
          onOpenAddAppliance={onOpenAddAppliance}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-8">
          {children}
          <StorageDisclosureFooter />
        </main>
      </div>
    </div>
  );
};
