"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signUpNewUser } from "@/lib/supabase/auth-helpers";
import { acceptInvitation } from "@/lib/supabase/invitation-helpers";
import { supabase } from "@/lib/supabase/client";
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
  const [invitationRole, setInvitationRole] = useState<"admin" | "employee">("employee");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for invitation when component mounts
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
      
      // Clear any existing session first to avoid refresh errors
      const initializeSignup = async () => {
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.log("No existing session to clear");
        }
        
        // Fetch the invitation to get the role
        const { data, error } = await supabase
          .from("invitations")
          .select("role")
          .eq("email", emailParam)
          .eq("status", "pending")
          .single();
        
        if (data && !error) {
          setInvitationRole(data.role || "employee");
        }
      };
      
      initializeSignup();
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if this is an invited user
      const emailParam = searchParams.get("email");
      
      if (emailParam) {
        // Use the API route for invited users (auto-confirms email)
        const response = await fetch("/api/auth/signup-invited", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            fullName,
            role: invitationRole,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create account");
        }

        const responseData = await response.json();

        if (responseData.user) {
          // Mark invitation as accepted
          await acceptInvitation(email, responseData.user.id);
          
          // Redirect to login page with success message
          router.push(`/auth/login?email=${encodeURIComponent(email)}&signup=success`);
        }
      } else {
        // Regular signup (not invited)
        const { user, session } = await signUpNewUser(email, password, fullName, invitationRole);

        if (!session) {
          // email confirmation needed
          router.push("/auth/verify");
        } else {
          router.push("/dashboard");
        }
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
                suppressHydrationWarning={true}
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
                suppressHydrationWarning={true}
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
                suppressHydrationWarning={true}
              />
            </div>

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <Button type="submit" className="w-full mt-4 bg-blue-600 text-white hover:bg-blue-500" disabled={loading} suppressHydrationWarning={true}>
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
