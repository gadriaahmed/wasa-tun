import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Login } from "@/pages/Login";
import { SsoLogin } from "@/pages/SsoLogin";
import { Experiments } from "@/pages/Experiments";
import { ExperimentDetail } from "@/pages/ExperimentDetail";
import { ExperimentCreate } from "@/pages/ExperimentCreate";
import { Applications } from "@/pages/Applications";
import { ApplicationPriorities } from "@/pages/ApplicationPriorities";
import { ApplicationPages } from "@/pages/ApplicationPages";
import { ApplicationLogs } from "@/pages/ApplicationLogs";
import { Users } from "@/pages/Users";
import { Superadmins } from "@/pages/Superadmins";
import { Feedback } from "@/pages/Feedback";
import { UserAccess } from "@/pages/UserAccess";
import { Plugins } from "@/pages/Plugins";
import { NotFound } from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function AdminRoute() {
  const { isAdmin } = useAuthContext();
  if (!isAdmin) {
    return <Navigate to="/experiments" replace />;
  }
  return <Outlet />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/sso" element={<SsoLogin />} />

            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/experiments" replace />} />
                <Route path="/experiments" element={<Experiments />} />
                <Route path="/experiments/new" element={<ExperimentCreate />} />
                <Route path="/experiments/:id" element={<ExperimentDetail />} />

                <Route element={<AdminRoute />}>
                  <Route path="/applications" element={<Applications />} />
                  <Route
                    path="/applications/:appName/priorities"
                    element={<ApplicationPriorities />}
                  />
                  <Route
                    path="/applications/:appName/pages"
                    element={<ApplicationPages />}
                  />
                  <Route
                    path="/applications/:appName/logs"
                    element={<ApplicationLogs />}
                  />
                  <Route path="/users" element={<Users />} />
                  <Route path="/superadmins" element={<Superadmins />} />
                  <Route path="/feedback" element={<Feedback />} />
                  <Route path="/plugins" element={<Plugins />} />
                  <Route
                    path="/user-access/:username/:appname/:access"
                    element={<UserAccess />}
                  />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;
