
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Play,
  LayoutTemplate,
  FileText,
  BrainCircuit,
  Settings,
} from "lucide-react";

interface DashboardSidebarProps {
  onNavClick: () => void;
}

export function DashboardSidebar({ onNavClick }: DashboardSidebarProps) {
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/videos", label: "My Videos", icon: Play },
    { href: "/dashboard/templates", label: "Templates", icon: LayoutTemplate },
    { href: "/dashboard/scripts", label: "Scripts", icon: FileText },
    { href: "/dashboard/generator", label: "AI Generator", icon: BrainCircuit },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="bg-white transition-all duration-300 ease-in-out dark:bg-gray-950 w-64 min-w-64 shrink-0 border-r">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">SmartVid</h1>
      </div>
      <div className="space-y-1 p-2 overflow-y-auto h-[calc(100vh-4rem)]">
        {links.map((link) => (
          <NavLink
            key={link.href}
            to={link.href}
            onClick={() => {
              onNavClick();
            }}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary dark:bg-gray-800 dark:text-primary-light"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              )
            }
            end={link.href === "/dashboard"}
          >
            <link.icon className="mr-2 h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
