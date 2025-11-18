"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUpNewUser } from "@/lib/supabase/auth-helpers";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { user, session } = await signUpNewUser(email, password, fullName);

      if (!session) {
        // email confirmation needed
        router.push("/auth/verify");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <Card className="w-full max-w-md shadow-lg border border-gray-200 bg-white text-gray-900">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-3xl font-semibold tracking-tight text-gray-900">
            Create an Account
          </CardTitle>
          <CardDescription className="text-gray-700">
            Sign up to get started with your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="fullName" className="text-gray-800">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-gray-100 text-gray-900 border-gray-300 placeholder-gray-500"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-800">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-100 text-gray-900 border-gray-300 placeholder-gray-500"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password" className="text-gray-800">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-100 text-gray-900 border-gray-300 placeholder-gray-500"
              />
            </div>

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <Button type="submit" className="w-full mt-4 bg-blue-600 text-white hover:bg-blue-500" disabled={loading}>
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>

            <p className="text-center text-sm text-gray-700 mt-3">
              Already have an account?{" "}
              <a href="/auth/login" className="text-blue-600 hover:underline">
                Log in
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
