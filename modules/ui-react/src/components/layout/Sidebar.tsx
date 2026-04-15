import { NavLink, useNavigate } from "react-router-dom";
import { FlaskConical, Grid2x2, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Experiments", to: "/experiments", icon: FlaskConical },
  { label: "Applications", to: "/applications", icon: Grid2x2 },
  { label: "Users", to: "/users", icon: Users },
];

export function Sidebar() {
  const navigate = useNavigate();
  const email =
    (typeof window !== "undefined" &&
      window.localStorage.getItem("auth_email")) ||
    "admin@example.com";

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("token");
    }
    navigate("/login", { replace: true });
  };

  return (
    <aside className="flex w-1/4 flex-col border-r border-slate-800 bg-[#1e1b4b]">
      <div className="flex h-16 items-center px-6 text-xl font-bold tracking-tight">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
          <span className="text-base font-semibold text-white">
            Wasabi
          </span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4 text-sm">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white/60 transition-colors",
                  "border-l-2 border-transparent hover:bg-indigo-700/60 hover:text-white",
                  isActive &&
                    "border-indigo-400 bg-indigo-600 text-white"
                )
              }
            >
              <Icon className="h-4 w-4 text-white/60 group-hover:text-white" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-indigo-900/60 px-3 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-400/20 text-xs font-semibold text-white">
              {email.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-white">
                Signed in
              </span>
              <span className="truncate text-xs text-white/60">{email}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/50 hover:bg-indigo-700/80 hover:text-red-300"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

