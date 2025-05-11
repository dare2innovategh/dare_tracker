import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  BarChart4,
  Briefcase,
  Building2,
  FileText,
  Home,
  Settings,
  Users,
  Clipboard,
  BadgeCheck,
  LayoutDashboard
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  allowedRoles?: string[];
}

export function SideNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const userRole = user?.role || "";

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Youth Profiles",
      href: "/youth-profiles",
      icon: <Users className="h-5 w-5" />,
      allowedRoles: ["admin", "manager", "mentor", "reviewer"],
    },
    {
      title: "Businesses",
      href: "/businesses",
      icon: <Briefcase className="h-5 w-5" />,
      allowedRoles: ["admin", "manager", "mentor", "reviewer"],
    },
    {
      title: "Business Tracking",
      href: "/business-tracking",
      icon: <BarChart4 className="h-5 w-5" />,
      allowedRoles: ["admin", "manager", "mentor", "reviewer"],
    },

    {
      title: "Makerspaces",
      href: "/makerspaces",
      icon: <Building2 className="h-5 w-5" />,
      allowedRoles: ["admin", "manager"],
    },
    {
      title: "Training Programs",
      href: "/training/programs",
      icon: <BadgeCheck className="h-5 w-5" />,
      allowedRoles: ["admin", "manager", "mentor"],
    },
    {
      title: "Reports",
      href: "/reports",
      icon: <FileText className="h-5 w-5" />,
      allowedRoles: ["admin", "manager"],
    },
    {
      title: "Admin",
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      allowedRoles: ["admin"],
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  // Filter navItems based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!item.allowedRoles) return true;
    return !userRole || item.allowedRoles.includes(userRole);
  });

  return (
    <div className="flex flex-col h-full border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <img src="/dare-logo.png" alt="DARE Logo" className="h-8" />
          <span>DARE Platform</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-auto py-2">
        <div className="px-2 space-y-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                location === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </div>
      </nav>
      <div className="mt-auto p-4 border-t">
        <div className="text-xs text-muted-foreground">
          <p>DARE Digital Platform</p>
          <p>© 2025 DARETRANSITION</p>
        </div>
      </div>
    </div>
  );
}