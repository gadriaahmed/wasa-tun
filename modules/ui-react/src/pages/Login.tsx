import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/api/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const basic = btoa(`${email}:${password}`);

      // Verify credentials by calling ping with Basic auth
      await apiClient.get("/api/v1/ping", {
        headers: {
          Authorization: `Basic ${basic}`,
        },
      });

      if (typeof window !== "undefined") {
        window.localStorage.setItem("token", basic);
      }

      navigate("/experiments", { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 500) {
        setError("Invalid credentials");
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md border-slate-200 shadow-lg">
        <CardHeader className="space-y-2">
          <div className="text-sm font-semibold uppercase tracking-wide text-indigo-500">
            Wasabi
          </div>
          <CardTitle className="text-2xl text-slate-900">
            Sign in to your account
          </CardTitle>
          <CardDescription>
            Enter your admin credentials to access the Wasabi console.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

