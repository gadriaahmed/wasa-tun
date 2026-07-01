import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquarePlus } from "lucide-react";
import { FeedbackForm } from "@/pages/Feedback";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { email } = useAuth();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const initial = (email ?? "W").charAt(0).toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">
        <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <MessageSquarePlus className="size-4" />
              Feedback
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send feedback</DialogTitle>
              <DialogDescription>
                Share suggestions or report issues with the Wasabi console.
              </DialogDescription>
            </DialogHeader>
            <FeedbackForm onSent={() => setFeedbackOpen(false)} />
          </DialogContent>
        </Dialog>
        <Button size="sm" asChild>
          <Link to="/experiments/new">New Experiment</Link>
        </Button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {initial}
        </div>
      </div>
    </header>
  );
}
