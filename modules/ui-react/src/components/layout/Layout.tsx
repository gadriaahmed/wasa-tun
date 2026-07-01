import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

const titleMap: Record<string, string> = {
  "/experiments": "Experiments",
  "/experiments/new": "New Experiment",
  "/applications": "Applications",
  "/users": "Users",
  "/superadmins": "Superadmins",
  "/feedback": "Feedback",
  "/plugins": "Plugins",
};

function resolveTitle(pathname: string): string {
  if (titleMap[pathname]) {
    return titleMap[pathname];
  }
  if (pathname.startsWith("/experiments/")) {
    return "Experiment Details";
  }
  if (pathname.includes("/priorities")) {
    return "Priorities";
  }
  if (pathname.includes("/pages")) {
    return "Page Manager";
  }
  if (pathname.includes("/logs")) {
    return "Audit Logs";
  }
  return "Wasabi Console";
}

export function Layout() {
  const location = useLocation();
  const title = resolveTitle(location.pathname);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
