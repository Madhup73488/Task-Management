"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser, signOut } from "@/lib/supabase/auth-helpers";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
} from "@/app/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  ListTodo,
  Settings,
  Search,
  Bell,
  Moon,
  LogOut,
  Shield,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0); // Initialize with 0, will be updated when actual notifications arrive
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  // Effect to update searchQuery when URL changes (e.g., direct navigation or back/forward)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchQuery(params.get("search") || "");
  }, [pathname]);

  // Load dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push("/auth/login");
          return;
        }
        if (currentUser.role !== "admin") {
          router.push("/dashboard");
          return;
        }
        setUser(currentUser);
      } catch (err) {
        console.error("Error fetching user:", err);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? "bg-black" : "bg-gray-50"
        }`}
      >
        <div className="text-center">
          <div
            className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
              darkMode ? "border-white" : "border-gray-900"
            } mx-auto`}
          ></div>
          <p className={`mt-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  return (
    <SidebarProvider>
      <div
        className={`flex h-screen ${darkMode ? "dark bg-black" : "bg-gray-50"}`}
      >
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center">
                <Shield size={18} className="text-white" />
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-semibold text-sm ${
                    darkMode ? "text-white" : ""
                  }`}
                >
                  Admin Panel
                </span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <div className="mb-6">
              <div className="px-4 mb-2">
                <h3
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Main Menu
                </h3>
              </div>
              <SidebarMenu>
                <SidebarMenuItem
                  active={isActive("/admin/dashboard")}
                  icon={<LayoutDashboard size={20} />}
                  onClick={() => router.push("/admin/dashboard")}
                >
                  Dashboard
                </SidebarMenuItem>
                <SidebarMenuItem
                  active={isActive("/admin/users")}
                  icon={<Users size={20} />}
                  onClick={() => router.push("/admin/users")}
                >
                  Users
                </SidebarMenuItem>
                <SidebarMenuItem
                  active={isActive("/admin/tasks")}
                  icon={<ListTodo size={20} />}
                  onClick={() => router.push("/admin/tasks")}
                >
                  All Tasks
                </SidebarMenuItem>
              </SidebarMenu>
            </div>

            <div>
              <div className="px-4 mb-2">
                <h3
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Settings
                </h3>
              </div>
              <SidebarMenu>
                <SidebarMenuItem
                  icon={<Settings size={20} />}
                  onClick={() => {}}
                >
                  System Settings
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarContent>

          <SidebarFooter>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                  {user.user_metadata?.full_name?.charAt(0)?.toUpperCase() ||
                    user.email?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {user.user_metadata?.full_name || "Admin"}
                  </p>
                  <p
                    className={`text-xs truncate ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {user.email}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className={`w-full justify-start gap-2 ${
                  darkMode
                    ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                    : ""
                }`}
                onClick={handleSignOut}
              >
                <LogOut size={16} />
                Sign Out
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header
            className={`border-b px-6 py-4 ${
              darkMode ? "bg-black border-gray-800" : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`relative ${
                    darkMode
                      ? "text-gray-300 hover:text-white hover:bg-gray-800"
                      : ""
                  }`}
                >
                  <Bell size={20} className={darkMode ? "text-gray-300" : ""} />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                      {notificationCount}
                    </span>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={
                    darkMode
                      ? "text-gray-300 hover:text-white hover:bg-gray-800"
                      : ""
                  }
                  onClick={toggleDarkMode}
                  title={
                    darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                  }
                >
                  <Moon
                    size={20}
                    className={
                      darkMode ? "fill-yellow-400 text-yellow-400" : ""
                    }
                  />
                </Button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
