
import { Outlet, useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogOut, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export default function DashboardLayout() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
      return;
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error("Failed to log out");
    }
  };

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render if not authenticated (redirect will happen)
  if (!user) {
    return null;
  }

  const userName = user?.email?.split('@')[0] || "User";
  const userEmail = user?.email || "";
  const userInitials = userName
    .split(" ")
    .map((n) => n?.[0] || "")
    .join("")
    .toUpperCase().substring(0, 2);

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
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                  aria-label="Open user menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4 text-muted-foreground" />
                    </AvatarFallback>
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
          <DashboardSidebar onNavClick={() => {}} />
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
