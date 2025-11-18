"use client";

import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import Link from "next/link";
import {
  CheckCircle2,
  Users,
  BarChart3,
  Shield,
  Zap,
  Target,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmail,
  getCurrentUser,
  USE_MOCK_AUTH,
} from "@/lib/supabase/auth-helpers";

export default function HomePage() {
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const features = [
    {
      icon: <Target className="h-6 w-6" />,
      title: "Task Management",
      description:
        "Organize and prioritize tasks with ease. Set deadlines, assign tasks, and track progress in real-time.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Collaboration",
      description:
        "Work together seamlessly. Share updates, communicate efficiently, and achieve goals as a team.",
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Analytics & Insights",
      description:
        "Get detailed insights into team performance, task completion rates, and productivity metrics.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Reliable",
      description:
        "Enterprise-grade security with role-based access control to keep your data safe.",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Fast & Efficient",
      description:
        "Lightning-fast performance with real-time updates and notifications.",
    },
    {
      icon: <CheckCircle2 className="h-6 w-6" />,
      title: "Easy to Use",
      description:
        "Intuitive interface designed for productivity. Get started in minutes, not hours.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] bg-top" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Powerful Task Management
          </Badge>

          <h1 className="mx-auto max-w-4xl font-display text-5xl font-bold tracking-tight text-slate-900 sm:text-7xl">
            Manage Tasks{" "}
            <span className="relative whitespace-nowrap text-primary">
              <span className="relative">Efficiently</span>
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700">
            Streamline your workflow, boost productivity, and achieve more with
            our comprehensive task management solution.
          </p>

          <div className="mt-10 flex justify-center gap-x-6">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-black text-white hover:bg-black/90 group"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowSignInModal(true)}
              className="border-foreground text-foreground hover:bg-foreground hover:text-background"
            >
              Sign In
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-8">
            <div>
              <div className="text-4xl font-bold text-primary">10K+</div>
              <div className="mt-2 text-sm text-slate-600">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">50K+</div>
              <div className="mt-2 text-sm text-slate-600">Tasks Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">99.9%</div>
              <div className="mt-2 text-sm text-slate-600">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">24/7</div>
              <div className="mt-2 text-sm text-slate-600">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">
              Everything you need
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              All-in-one task management platform
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Powerful features to help you and your team stay organized and
              productive.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-7xl">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="transition-all hover:shadow-lg hover:scale-105"
                >
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative isolate overflow-hidden bg-secondary">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ready to boost your productivity?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Join thousands of teams already using our platform to manage their
              tasks more effectively.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-black text-white hover:bg-black/90 group"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-foreground text-foreground hover:bg-foreground hover:text-background"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Sign In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowSignInModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
              <p className="text-sm text-gray-600 mt-2">
                Welcome back! Please sign in to continue
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                setError(null);

                try {
                  // Use mock sign-in if USE_MOCK_AUTH is true
                  if (
                    USE_MOCK_AUTH &&
                    email === "mallikam8105@gmail.com" &&
                    password === "pass123"
                  ) {
                    const user = await getCurrentUser();
                    if (user && user.role === "admin") {
                      router.push("/admin/dashboard");
                    } else {
                      router.push("/dashboard");
                    }
                  } else {
                    // Proceed with real Supabase sign-in
                    await signInWithEmail(email, password);
                    const user = await getCurrentUser();

                    if (user && user.user_metadata?.role === "admin") {
                      router.push("/admin/dashboard");
                    } else if (user) {
                      router.push("/dashboard");
                    } else {
                      setError(
                        "Login successful, but could not retrieve user data. Please try again."
                      );
                    }
                  }
                } catch (err: any) {
                  if (err.message === "Email not confirmed") {
                    setError(
                      "Please check your email to confirm your account before signing in."
                    );
                  } else {
                    setError(err.message || "An unexpected error occurred.");
                  }
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Remember me
                  </span>
                </label>
                <Link
                  href="/auth/login"
                  className="text-sm text-black hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-black/90"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="text-black hover:underline font-medium"
                >
                  Sign up
                </Link>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
