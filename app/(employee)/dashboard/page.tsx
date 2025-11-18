"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Calendar,
  Filter,
} from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    notPicked: 0,
  });
  const [priorityStats, setPriorityStats] = useState({
    high: 0,
    medium: 0,
    low: 0,
  });
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push("/auth/login");
          return;
        }
        setUser(currentUser);

        // Fetch tasks from database
        const { supabase } = await import("@/lib/supabase/client");
        const { data: tasksData, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("assigned_to", currentUser.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setTasks(tasksData || []);

        // Calculate stats
        const total = tasksData?.length || 0;
        const inProgress = tasksData?.filter((t: any) => t.status === "in_progress").length || 0;
        const completed = tasksData?.filter((t: any) => t.status === "completed").length || 0;
        const notPicked = tasksData?.filter((t: any) => t.status === "not_picked").length || 0;

        setTaskStats({ total, inProgress, completed, notPicked });

        // Calculate priority stats
        const high = tasksData?.filter((t: any) => t.priority === "high").length || 0;
        const medium = tasksData?.filter((t: any) => t.priority === "medium").length || 0;
        const low = tasksData?.filter((t: any) => t.priority === "low").length || 0;

        setPriorityStats({ high, medium, low });
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      label: "Total Tasks",
      value: taskStats.total.toString(),
      icon: <ListTodo size={20} />,
      color: "bg-blue-500",
    },
    {
      label: "In Progress",
      value: taskStats.inProgress.toString(),
      icon: <Clock size={20} />,
      color: "bg-yellow-500",
    },
    {
      label: "Completed",
      value: taskStats.completed.toString(),
      icon: <CheckCircle2 size={20} />,
      color: "bg-green-500",
    },
    {
      label: "Not Picked",
      value: taskStats.notPicked.toString(),
      icon: <AlertCircle size={20} />,
      color: "bg-gray-500",
    },
  ];

  const recentTasks = tasks.slice(0, 5);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "not_picked":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatStatus = (status: string) => {
    return status
      .replace("_", " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Welcome back, {user?.user_metadata?.full_name || "Employee"}!
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
            <Calendar size={16} className="text-gray-500" />
            <span className="text-gray-700">This Week</span>
          </div>
          <Button className="bg-gray-900 text-white hover:bg-gray-800">
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Task Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {statsCards.map((stat, idx) => (
          <Card key={idx} className="bg-white border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-full ${stat.color} bg-opacity-10`}
                >
                  <div className="text-gray-900">{stat.icon}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Task Completion Chart */}
        <Card className="bg-white border-gray-200 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-900">
              Task Completion Trend
            </CardTitle>
            <CardDescription className="text-xs">
              Your task completion rate over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 relative">
              <svg className="w-full h-full" viewBox="0 0 700 200">
                {/* Grid lines */}
                <line
                  x1="0"
                  y1="0"
                  x2="700"
                  y2="0"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="50"
                  x2="700"
                  y2="50"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="100"
                  x2="700"
                  y2="100"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="150"
                  x2="700"
                  y2="150"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="200"
                  x2="700"
                  y2="200"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />

                {/* Line chart */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  points="0,150 100,120 200,100 300,80 400,90 500,60 600,50 700,40"
                />

                {/* Data points */}
                {[0, 100, 200, 300, 400, 500, 600, 700].map((x, i) => {
                  const y = [150, 120, 100, 80, 90, 60, 50, 40][i];
                  return (
                    <circle key={i} cx={x} cy={y} r="4" fill="#10b981" />
                  );
                })}
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-900">
              Priority Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              Tasks by priority level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">High</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {priorityStats.high} tasks
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${taskStats.total > 0 ? (priorityStats.high / taskStats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Medium</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {priorityStats.medium} tasks
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${taskStats.total > 0 ? (priorityStats.medium / taskStats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Low</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {priorityStats.low} tasks
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${taskStats.total > 0 ? (priorityStats.low / taskStats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-gray-900">
              Recent Tasks
            </CardTitle>
            <CardDescription className="text-xs">
              Your most recent task assignments
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Filter size={14} className="mr-2" />
            Filter
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => router.push(`/mytasks`)}
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge
                      className={`text-xs px-2 py-0.5 border ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority.toUpperCase()}
                    </Badge>
                    <Badge
                      className={`text-xs px-2 py-0.5 border ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {formatStatus(task.status)}
                    </Badge>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {task.deadline}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/mytasks")}
            >
              View All Tasks
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
