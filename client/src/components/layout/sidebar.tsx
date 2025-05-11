import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { User as UserType } from "@shared/schema";
import { usePermissions } from "@/hooks/use-permissions";
import { 
  LayoutDashboard, 
  Users, 
  LineChart, 
  UsersRound, 
  Settings, 
  FileBarChart, 
  LogOut,
  UserCog,
  Briefcase,
  Warehouse,
  Shield,
  UserPlus,
  KeyRound,
  User,
  SquareCheck,
  GraduationCap
} from "lucide-react";
import dareLogo from "@assets/dare-logo.png";

interface SidebarProps {
  user: UserType | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  const { hasPermission } = usePermissions();
  
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/";
      }
    });
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200 transition-all duration-300">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-auto">
            <img src={dareLogo} alt="DARE Logo" className="h-full w-auto" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-primary-600">DARE Tracker</h1>
            <p className="text-xs text-gray-500">Youth-in-Jobs Program</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <Link href="/dashboard">
          <div className={`flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
            isActive("/dashboard") 
              ? "bg-primary-50 text-primary-600" 
              : "text-gray-700 hover:bg-gray-100"
          } transition-colors group`}>
            <LayoutDashboard className="mr-3 h-5 w-5" />
            <span>Dashboard</span>
          </div>
        </Link>
        
        <div className="pt-2">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Main Modules</p>
        </div>
        
        <Link href="/youth-profiles">
          <div className={`flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
            isActive("/youth-profiles") 
              ? "bg-primary-50 text-primary-600" 
              : "text-gray-700 hover:bg-gray-100"
          } transition-colors group`}>
            <Users className="mr-3 h-5 w-5" />
            <span>Youth Profiles</span>
          </div>
        </Link>
        
        {/* Training Programs - wrapped with permission check */}
        {hasPermission("training", "view") && (
          <Link href="/training-programs">
            <div className={`flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
              isActive("/training-programs") 
                ? "bg-primary-50 text-primary-600" 
                : "text-gray-700 hover:bg-gray-100"
            } transition-colors group`}>
              <GraduationCap className="mr-3 h-5 w-5" />
              <span>Training Programs</span>
            </div>
          </Link>
        )}
        
        <Link href="/mentorship">
          <div className={`flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
            isActive("/mentorship") 
              ? "bg-primary-50 text-primary-600" 
              : "text-gray-700 hover:bg-gray-100"
          } transition-colors group`}>
            <UsersRound className="mr-3 h-5 w-5" />
            <span>Mentorship</span>
          </div>
        </Link>
        
        <div className="pt-2">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Administrative</p>
        </div>
        
        <Link href="/mentors">
          <div className={`flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
            isActive("/mentors") 
              ? "bg-primary-50 text-primary-600" 
              : "text-gray-700 hover:bg-gray-100"
          } transition-colors group`}>
            <UserCog className="mr-3 h-5 w-5" />
            <span>Mentors</span>
          </div>
        </Link>
        
        <Link href="/makerspaces">
          <div className={`flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
            isActive("/makerspaces") 
              ? "bg-primary-50 text-primary-600" 
              : "text-gray-700 hover:bg-gray-100"
          } transition-colors group`}>
            <Warehouse className="mr-3 h-5 w-5" />
            <span>Makerspaces</span>
          </div>
        </Link>

        <div className="pt-2">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User Management</p>
        </div>
        
        {hasPermission("users", "view") && (
          <Link href="/admin/users">
            <div className={`flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
              isActive("/admin/users") 
                ? "bg-primary-50 text-primary-600" 
                : "text-gray-700 hover:bg-gray-100"
            } transition-colors group`}>
              <UserPlus className="mr-3 h-5 w-5" />
              <span>Users</span>
            </div>
          </Link>
        )}
        
        {hasPermission("roles", "view") && (
          <Link href="/admin/roles">
            <div className={`flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
              isActive("/admin/roles") 
                ? "bg-primary-50 text-primary-600" 
                : "text-gray-700 hover:bg-gray-100"
            } transition-colors group`}>
              <Shield className="mr-3 h-5 w-5" />
              <span>Role Management</span>
            </div>
          </Link>
        )}
        
        {hasPermission("permissions", "manage") && (
          <Link href="/admin/permissions">
            <div className={`flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
              isActive("/admin/permissions") 
                ? "bg-primary-50 text-primary-600" 
                : "text-gray-700 hover:bg-gray-100"
            } transition-colors group`}>
              <KeyRound className="mr-3 h-5 w-5" />
              <span>Permissions</span>
            </div>
          </Link>
        )}
        
        <div className="pt-2">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">System</p>
        </div>
        
        {hasPermission("reports", "view") && (
          <Link href="/reports">
            <div className={`flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
              isActive("/reports") 
                ? "bg-primary-50 text-primary-600" 
                : "text-gray-700 hover:bg-gray-100"
            } transition-colors group`}>
              <FileBarChart className="mr-3 h-5 w-5" />
              <span>Reports</span>
            </div>
          </Link>
        )}
        
        {hasPermission("system_settings", "view") && (
          <Link href="/admin/settings">
            <div className={`flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
              isActive("/admin/settings") 
                ? "bg-primary-50 text-primary-600" 
                : "text-gray-700 hover:bg-gray-100"
            } transition-colors group`}>
              <Settings className="mr-3 h-5 w-5" />
              <span>System Settings</span>
            </div>
          </Link>
        )}
      </nav>
      
      <div className="p-4 border-t">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-medium overflow-hidden">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.fullName || user.username} className="h-full w-full object-cover" />
              ) : (
                user?.fullName?.[0] || user?.username?.[0] || '?'
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {user?.fullName || user?.username || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate capitalize">
              {user?.role || 'User'}
            </p>
          </div>
          <button 
            className="text-gray-400 hover:text-gray-600" 
            onClick={handleLogout}
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
