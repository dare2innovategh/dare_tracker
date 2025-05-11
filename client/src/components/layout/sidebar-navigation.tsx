import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import {
  Users,
  Briefcase,
  Building,
  Settings,
  Home,
  LayoutGrid,
  Store,
  Landmark,
  Map,
  MessagesSquare,
  BarChart3,
  Puzzle,
  AreaChart,
  LogOut,
  GraduationCap,
  UserPlus
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PermissionGuard, MultiPermissionGuard } from '@/components/permission-guard';
import { Resource, Action } from '@/lib/permissions';

// Use actual Digital Access for Rural Empowerment logo
const dareLogo = "/img/dare-logo.png";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  indented?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, label, active, indented }) => {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={cn(
          'w-full justify-start gap-2 mb-1',
          active ? 'bg-accent/50 text-accent-foreground font-medium' : 'text-muted-foreground',
          indented ? 'pl-8' : 'pl-3'
        )}
      >
        {icon}
        <span>{label}</span>
      </Button>
    </Link>
  );
};

export interface SidebarNavigationProps {
  className?: string;
}

export function SidebarNavigation({ className }: SidebarNavigationProps) {
  const [location] = useLocation();
  const { logoutMutation, user } = useAuth();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = '/auth';
  };

  return (
    <div className={cn("flex flex-col h-full py-4", className)}>
      {/* Logo and title container with separate divs for better spacing */}
      <div className="px-4 mb-6">
        <div className="flex">
          <img src={dareLogo} alt="Digital Access for Rural Empowerment Logo" className="h-8 w-auto" />
        </div>
        <div className="font-bold text-lg mt-3">YIW Tracker</div>
      </div>
      
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-4">
          <div>
            <NavItem 
              href="/dashboard" 
              icon={<Home className="h-4 w-4" />} 
              label="Dashboard" 
              active={location === '/dashboard'}
            />
          </div>
          
          <div className="pt-2">
            <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider px-3 mb-2">
              Management
            </h4>
            
            {/* Youth Profiles - available to anyone with view permission */}
            <PermissionGuard resource={Resource.YOUTH} action={Action.VIEW}>
              <NavItem 
                href="/youth/profiles" 
                icon={<Users className="h-4 w-4" />} 
                label="Youth" 
                active={location === '/youth/profiles' || location.startsWith('/youth/profiles/')}
              />
            </PermissionGuard>
            
            {/* Training Programs - available to anyone with view permission */}
            <PermissionGuard resource={Resource.TRAINING_PROGRAMS} action={Action.VIEW}>
              <NavItem 
                href="/training-programs" 
                icon={<GraduationCap className="h-4 w-4" />} 
                label="Training Programs" 
                active={location === '/training-programs' || location.startsWith('/training-programs/')}
              />
            </PermissionGuard>

            {/* Businesses - available to anyone with view permission */}
            <PermissionGuard resource={Resource.BUSINESSES} action={Action.VIEW}>
              <NavItem 
                href="/businesses" 
                icon={<Briefcase className="h-4 w-4" />} 
                label="Businesses" 
                active={location === '/businesses' || location.startsWith('/businesses/')}
              />
            </PermissionGuard>

            {/* Makerspaces - available to anyone with view permission */}
            <PermissionGuard resource={Resource.MAKERSPACES} action={Action.VIEW}>
              <NavItem 
                href="/makerspaces" 
                icon={<Building className="h-4 w-4" />} 
                label="Makerspaces" 
                active={location === '/makerspaces' || location.startsWith('/makerspaces/')}
              />
            </PermissionGuard>

            {/* Mentors - available to users with permission to view mentors */}
            <PermissionGuard resource={Resource.MENTORS} action={Action.VIEW}>
              <NavItem 
                href="/mentors" 
                icon={<Users className="h-4 w-4" />} 
                label="Mentors" 
                active={location === '/mentors' || location.startsWith('/mentors/')}
              />
            </PermissionGuard>

            {/* Mentor Assignment - available to users with permission */}
            <PermissionGuard resource={Resource.MENTOR_ASSIGNMENT} action={Action.VIEW}>
              <NavItem 
                href="/mentor-assignment" 
                icon={<UserPlus className="h-4 w-4" />} 
                label="Mentor Assignment" 
                active={location === '/mentor-assignment'}
              />
            </PermissionGuard>

            {/* Mentorship - available to users with permission */}
            <PermissionGuard resource={Resource.MENTORSHIP} action={Action.VIEW}>
              <NavItem 
                href="/mentorship" 
                icon={<MessagesSquare className="h-4 w-4" />} 
                label="Mentorship" 
                active={location === '/mentorship'}
              />
            </PermissionGuard>

            {/* Reports - available to users with permission */}
            <PermissionGuard resource={Resource.REPORTS} action={Action.VIEW}>
              <NavItem 
                href="/reports" 
                icon={<AreaChart className="h-4 w-4" />} 
                label="Reports" 
                active={location === '/reports' || location.startsWith('/reports/')}
              />
            </PermissionGuard>
          </div>

          {/* Admin Utilities section */}
          <PermissionGuard resource={Resource.ADMIN_PANEL} action={Action.VIEW}>
            <div className="pt-2">
              <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider px-3 mb-2">
                Admin Utilities
              </h4>
              
              <PermissionGuard resource={Resource.USERS} action={Action.VIEW}>
                <NavItem 
                  href="/admin/users" 
                  icon={<Users className="h-4 w-4" />} 
                  label="User Management" 
                  active={location === '/admin/users' || location.startsWith('/admin/users/')}
                />
              </PermissionGuard>
              
              <PermissionGuard resource={Resource.ROLES} action={Action.VIEW}>
                <NavItem 
                  href="/admin/roles" 
                  icon={<Puzzle className="h-4 w-4" />} 
                  label="Role Management" 
                  active={location === '/admin/roles' || location.startsWith('/admin/roles/')}
                />
              </PermissionGuard>
              
              <PermissionGuard resource={Resource.PERMISSIONS} action={Action.VIEW}>
                <NavItem 
                  href="/admin/permissions" 
                  icon={<LayoutGrid className="h-4 w-4" />} 
                  label="Permissions" 
                  active={location === '/admin/permissions' || location.startsWith('/admin/permissions/')}
                />
              </PermissionGuard>
              
              <PermissionGuard resource={Resource.SYSTEM_SETTINGS} action={Action.VIEW}>
                <NavItem 
                  href="/admin/settings" 
                  icon={<Settings className="h-4 w-4" />} 
                  label="System Settings" 
                  active={location === '/admin/settings'}
                />
              </PermissionGuard>
            </div>
          </PermissionGuard>
          
          <div className="pt-2">
            <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider px-3 mb-2">
              Account
            </h4>
            
            <NavItem 
              href="/settings" 
              icon={<Settings className="h-4 w-4" />} 
              label="Settings" 
              active={location === '/settings'}
            />
            
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 text-muted-foreground pl-3"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}