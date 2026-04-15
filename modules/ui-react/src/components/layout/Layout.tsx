import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

const titleMap: Record<string, string> = {
  "/experiments": "Experiments",
  "/applications": "Applications",
  "/users": "Users",
};

export function Layout() {
  const location = useLocation();
  const title = titleMap[location.pathname] ?? "Wasabi Console";

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
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

