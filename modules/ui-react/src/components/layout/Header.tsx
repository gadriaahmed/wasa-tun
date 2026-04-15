import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="text-[20px] font-semibold text-slate-900 tracking-tight">
        {title}
      </h1>
      <div className="flex items-center gap-3">
        <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
          New Experiment
        </Button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
          W
        </div>
      </div>
    </header>
  );
}

