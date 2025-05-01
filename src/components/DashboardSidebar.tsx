
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Video,
  FileText,
  PenTool,
  Palette,
  Settings,
  Zap,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState } from "react";

interface SidebarItemProps {
  icon: React.ElementType;
  title: string;
  to: string;
  active: boolean;
}

const SidebarItem = ({ icon: Icon, title, to, active }: SidebarItemProps) => {
  return (
    <Link to={to}>
      <div
        className={cn(
          "flex items-center space-x-3 rounded-lg px-3 py-2 transition-all hover:bg-sidebar-accent",
          active && "bg-sidebar-accent font-medium text-smartvid-600"
        )}
      >
        <Icon size={20} />
        <span>{title}</span>
      </div>
    </Link>
  );
};

export function DashboardSidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const sidebarItems = [
    { icon: Home, title: "Home", to: "/dashboard" },
    { icon: Video, title: "My Videos", to: "/dashboard/videos" },
    { icon: FileText, title: "Templates", to: "/dashboard/templates" },
    { icon: PenTool, title: "Scripts", to: "/dashboard/scripts" },
    { icon: Palette, title: "Brand Kit", to: "/dashboard/brand" },
    { icon: Settings, title: "Settings", to: "/dashboard/settings" },
  ];

  const pathSegments = location.pathname.split("/");
  const currentPath = pathSegments.slice(0, 3).join("/");

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button variant="outline" size="icon" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar for mobile (with overlay) */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden bg-black/50 transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={toggleSidebar}
      />

      {/* Sidebar content */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 flex-shrink-0 bg-sidebar flex flex-col border-r border-sidebar-border transition-transform duration-200 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex justify-between items-center p-4 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-smartvid-600">SmartVid</span>
          </Link>
          <div className="flex space-x-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="md:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <SidebarItem
                key={item.to}
                icon={item.icon}
                title={item.title}
                to={item.to}
                active={
                  currentPath === item.to ||
                  (item.to === "/dashboard" && location.pathname === "/dashboard")
                }
              />
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <Link to="/dashboard/upgrade">
            <Button variant="default" className="w-full mb-2 bg-smartvid-600 hover:bg-smartvid-700">
              <Zap className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Button>
          </Link>
          <Button variant="outline" className="w-full" asChild>
            <Link to="/logout">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Link>
          </Button>
        </div>
      </aside>
    </>
  );
}
