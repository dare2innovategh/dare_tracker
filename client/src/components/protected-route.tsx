import React from "react";
import { Redirect, Route, RouteProps } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useHasPermission, Resource, Action } from "@/lib/permissions";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ProtectedRouteProps extends RouteProps {
  resource: Resource;
  action: Action;
  fallbackPath?: string;
}

/**
 * A route that checks if the user has the required permission before rendering the component
 * If not, it redirects to the fallbackPath (defaults to "/dashboard")
 */
export function PermissionProtectedRoute({
  resource,
  action,
  fallbackPath = "/dashboard",
  ...rest
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const hasPermission = useHasPermission(resource, action);

  if (isLoading) {
    return (
      <Route {...rest}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route {...rest}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (!hasPermission) {
    return (
      <Route {...rest}>
        <Redirect to={fallbackPath} />
      </Route>
    );
  }

  return <Route {...rest} />;
}

/**
 * A route that checks if the user is authenticated before rendering the component
 * If not, it redirects to the auth page
 */
export function AuthProtectedRoute({ ...rest }: RouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route {...rest}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route {...rest}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return <Route {...rest} />;
}

/**
 * A component to display when permission is denied
 */
export function PermissionDenied() {
  return (
    <div className="container py-12 mx-auto">
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You do not have permission to access this page. Please contact an administrator if you believe this is an error.
        </AlertDescription>
      </Alert>
    </div>
  );
}