import { useAuth } from "@/hooks/use-auth";
import { Menu, User } from "lucide-react";
import { Link } from "wouter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SideNav } from "./sidenav";

export function Header() {
  const { user, logoutMutation } = useAuth();
  
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 sm:max-w-xs">
          <SideNav />
        </SheetContent>
      </Sheet>
      
      <div className="flex flex-1 items-center gap-4 md:gap-6">
        <Link href="/" className="hidden md:flex items-center gap-2">
          <img src="/dare-logo.png" alt="DARE Logo" className="h-8" />
        </Link>
        
        <Link href="/" className="flex items-center gap-2 md:hidden">
          <img src="/dare-logo.png" alt="DARE Logo" className="h-8" />
        </Link>
        
        <div className="flex flex-1 items-center justify-end gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profilePicture || ""} alt={user.username} />
                  <AvatarFallback>{user.username?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium">{user.fullName || user.username}</div>
                  <div className="text-muted-foreground">{user.role}</div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                Logout
              </Button>
            </div>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/auth">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}