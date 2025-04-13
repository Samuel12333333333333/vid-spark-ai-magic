
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Play,
  LayoutTemplate,
  FileText,
  BrainCircuit,
  Palette,
  Settings,
  Menu,
  X,
  Crown,
} from "lucide-react";
import { useState } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";

export function DashboardSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { hasActiveSubscription, isPro, isBusiness } = useSubscription();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/videos", label: "My Videos", icon: Play },
    { href: "/dashboard/templates", label: "Templates", icon: LayoutTemplate },
    { href: "/dashboard/scripts", label: "Scripts", icon: FileText },
    { href: "/dashboard/generator", label: "AI Generator", icon: BrainCircuit },
    { href: "/dashboard/brand", label: "Brand Kit", icon: Palette },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-smartvid-600 text-white shadow-lg md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar for both mobile and desktop */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-white transition-transform duration-300 ease-in-out dark:bg-gray-950 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold text-smartvid-600">SmartVid</h1>
        </div>
        <div className="space-y-1 p-2">
          {links.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-smartvid-100 text-smartvid-600 dark:bg-gray-800 dark:text-smartvid-400"
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

        {/* Subscription status */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="mb-2 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-2 text-sm font-medium">
              {hasActiveSubscription ? (
                <>
                  <span className="flex items-center text-smart-600">
                    <Crown className="mr-1 h-4 w-4 text-amber-500" />
                    {isPro ? "Pro Plan" : isBusiness ? "Business Plan" : "Premium Plan"}
                  </span>
                </>
              ) : (
                "Free Plan"
              )}
            </p>
            <NavLink to="/dashboard/upgrade" onClick={() => setIsOpen(false)}>
              <Button 
                className="w-full bg-smartvid-600 hover:bg-smartvid-700"
                variant="default"
                size="sm"
              >
                {hasActiveSubscription ? "Manage Plan" : "Upgrade Now"}
              </Button>
            </NavLink>
          </div>
        </div>
      </div>
    </>
  );
}
