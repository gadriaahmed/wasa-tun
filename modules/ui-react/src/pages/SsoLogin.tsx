import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSsoLogoutRedirect, getSsoRedirectUrl, isSsoEnabled } from "@/api/auth";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * SSO entry point (Phase 5). Enabled when VITE_AUTHN_TYPE=sso.
 * Redirects to the configured SSO provider; full cookie-based login
 * requires backend SSO integration matching legacy SignInCtrl behavior.
 */
export function SsoLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, signOut } = useAuth();

  useEffect(() => {
    if (!isSsoEnabled()) {
      return;
    }
    if (isAuthenticated) {
      navigate("/experiments", { replace: true });
      return;
    }
    const redirect = getSsoRedirectUrl();
    if (redirect) {
      window.location.href = redirect;
    }
  }, [isAuthenticated, navigate]);

  if (!isSsoEnabled()) {
    return (
      <Card className="mx-auto mt-24 max-w-md">
        <CardHeader>
          <CardTitle>SSO not enabled</CardTitle>
          <CardDescription>
            Set VITE_AUTHN_TYPE=sso and VITE_SSO_NO_AUTH_REDIRECT to enable
            single sign-on.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/login")}>Use basic auth</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-sm text-muted-foreground">Redirecting to SSO...</p>
      {getSsoLogoutRedirect() && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void signOut();
            window.location.href = getSsoLogoutRedirect()!;
          }}
        >
          SSO logout
        </Button>
      )}
    </div>
  );
}
