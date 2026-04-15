import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <h1 className="text-5xl font-bold text-slate-900">404</h1>
      <p className="mt-2 text-lg text-slate-600">
        The page you&apos;re looking for could not be found.
      </p>
      <Button asChild className="mt-6 bg-indigo-600 text-white hover:bg-indigo-700">
        <Link to="/experiments">Back to Experiments</Link>
      </Button>
    </div>
  );
}

