
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Users, 
  Activity, 
  Settings, 
  Shield,
  VideoIcon,
  Database,
  AlertTriangle
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: BarChart3 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Render Logs", href: "/admin/renders", icon: Activity },
  { name: "Quotas", href: "/admin/quotas", icon: Database },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Debug Tools", href: "/admin/debug", icon: AlertTriangle },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-muted/30 border-r min-h-[calc(100vh-73px)]">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/admin" && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
