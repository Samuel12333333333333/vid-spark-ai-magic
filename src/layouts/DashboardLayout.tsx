
import { Outlet, useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";

export function DashboardLayout() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<{ username?: string, avatar_url?: string } | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }
        
        setProfile(data);
      } catch (error) {
        console.error('Error in profile fetch:', error);
      }
    };
    
    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error("Failed to log out");
    }
  };

  // Function to handle navigation clicks - will be passed to both mobile and desktop sidebars
  const handleNavClick = () => {
    // For mobile, we want to close the sheet when navigation occurs
    if (isMobile) {
      setSidebarOpen(false);
    }
    // Could add additional navigation handling here if needed in the future
  };

  const userName = profile?.username || user?.email?.split('@')[0] || "User";
  const userEmail = user?.email || "";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
        <div className="flex flex-1 items-center justify-between">
          {isMobile && (
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[80%] max-w-[280px]">
                <div className="h-full overflow-y-auto">
                  <DashboardSidebar onNavClick={() => setSidebarOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          )}
          
          <div className={isMobile ? "flex items-center justify-center flex-1" : "hidden md:flex"}>
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationsDropdown />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                  aria-label="Open user menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ""} alt={userName} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" aria-label="User menu">
                <DropdownMenuItem className="font-semibold">{userName}</DropdownMenuItem>
                <DropdownMenuItem className="text-sm text-muted-foreground">
                  {userEmail}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex h-full">
          <DashboardSidebar onNavClick={handleNavClick} />
        </div>
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
