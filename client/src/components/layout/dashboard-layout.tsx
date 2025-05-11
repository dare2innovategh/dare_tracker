import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { SidebarNavigation } from './sidebar-navigation';
import { MobileMenu } from './mobile-menu';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
  pageTitle?: string;
}

export default function DashboardLayout({ children, className, pageTitle }: DashboardLayoutProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:block w-64 border-r shrink-0">
        <SidebarNavigation />
      </aside>

      {/* Mobile Menu Button & Dropdown */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {showMobileMenu && (
        <MobileMenu onClose={() => setShowMobileMenu(false)}>
          <SidebarNavigation />
        </MobileMenu>
      )}

      {/* Main Content */}
      <main className={cn("flex-1 py-6 px-4 md:px-6 lg:px-8", className)}>
        {pageTitle && (
          <h1 className="text-2xl font-bold mb-6">{pageTitle}</h1>
        )}
        {children}
      </main>
    </div>
  );
}