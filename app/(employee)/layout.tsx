"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser, signOut } from "@/lib/supabase/auth-helpers";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
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
  Search,
  Bell,
  LogOut,
  LayoutDashboard,
  ListTodo,
  User,
  Moon,
} from "lucide-react";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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
        if (currentUser.role === "admin") {
          router.push("/admin/dashboard");
          return;
        }
        setUser(currentUser);
        
        // Fetch assigned tasks
        const { data: tasksData } = await supabase
          .from("tasks")
          .select("*")
          .eq("assigned_to", currentUser.id)
          .order("created_at", { ascending: false })
          .limit(10);
        
        if (tasksData) {
          setTasks(tasksData);
        }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  return (
    <SidebarProvider>
      <div className={`flex h-screen ${darkMode ? 'dark bg-black' : 'bg-gray-50'}`}>
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center">
                <ListTodo size={18} className="text-white" />
              </div>
              <span className={`font-semibold text-sm ${darkMode ? 'text-white' : ''}`}>
                Task Manager
              </span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <div className="mb-6">
              <div className="px-4 mb-2">
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Main Menu
                </h3>
              </div>
              <SidebarMenu>
                <SidebarMenuItem
                  active={isActive("/dashboard")}
                  icon={<LayoutDashboard size={20} />}
                  onClick={() => router.push("/dashboard")}
                >
                  Dashboard
                </SidebarMenuItem>
                <SidebarMenuItem
                  active={isActive("/mytasks")}
                  icon={<ListTodo size={20} />}
                  onClick={() => router.push("/mytasks")}
                >
                  My Tasks
                </SidebarMenuItem>
                <SidebarMenuItem
                  active={isActive("/account")}
                  icon={<User size={20} />}
                  onClick={() => router.push("/account")}
                >
                  Account
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarContent>

          <SidebarFooter>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {user.user_metadata?.full_name?.charAt(0)?.toUpperCase() ||
                    user.email?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {user.user_metadata?.full_name || "User"}
                  </p>
                  <p className={`text-xs truncate ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>{user.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className={`w-full justify-start gap-2 ${
                  darkMode 
                    ? 'border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white' 
                    : ''
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
          <header className={`border-b px-6 py-4 ${
            darkMode 
              ? 'bg-black border-gray-800' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                      darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}
                    size={18}
                  />
                  <Input
                    placeholder="Search tasks..."
                    className={`pl-10 ${
                      darkMode
                        ? 'bg-gray-900 border-gray-800 text-white placeholder:text-gray-500'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`relative ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : ''}`}
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell size={20} className={darkMode ? 'text-gray-300' : ''} />
                  {tasks.length > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                      {tasks.length}
                    </span>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : ''}
                  onClick={toggleDarkMode}
                  title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  <Moon size={20} className={darkMode ? "fill-yellow-400 text-yellow-400" : ""} />
                </Button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto relative">
            {children}
            
            {/* Notification Panel */}
            {showNotifications && (
              <div className={`absolute top-0 right-0 h-full w-96 border-l shadow-lg z-50 overflow-y-auto ${
                darkMode 
                  ? 'bg-black border-gray-800' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className={`sticky top-0 border-b p-4 ${
                  darkMode
                    ? 'bg-black border-gray-800'
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : ''}`}>
                      Assigned Tasks
                    </h2>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : ''}
                      onClick={() => setShowNotifications(false)}
                    >
                      ✕
                    </Button>
                  </div>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} assigned to you
                  </p>
                </div>
                
                <div className="p-4 space-y-3">
                  {tasks.length === 0 ? (
                    <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No tasks assigned yet
                    </p>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          darkMode
                            ? 'border-gray-800 hover:bg-gray-900'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          router.push(`/mytasks/${task.id}`);
                          setShowNotifications(false);
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className={`font-medium flex-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {task.title}
                          </h3>
                          <Badge 
                            variant={
                              task.priority === "high" 
                                ? "destructive" 
                                : task.priority === "medium"
                                ? "default"
                                : "secondary"
                            }
                            className="ml-2"
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        
                        <p className={`text-sm line-clamp-2 mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {task.description}
                        </p>
                        
                        <div className={`flex items-center justify-between text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <span className={`px-2 py-1 rounded ${
                            darkMode
                              ? task.status === "completed"
                                ? "bg-green-900 text-green-200"
                                : task.status === "in_progress"
                                ? "bg-blue-900 text-blue-200"
                                : "bg-gray-800 text-gray-300"
                              : task.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : task.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {task.status.replace("_", " ")}
                          </span>
                          <span>
                            Due: {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
