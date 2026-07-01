import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchFeedback, sendFeedback } from "@/api/analytics";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FeedbackEntry } from "@/types";

export function Feedback() {
  const { isAdmin } = useAuth();

  const { data = [], isLoading } = useQuery({
    queryKey: ["feedback"],
    queryFn: fetchFeedback,
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <p className="text-sm text-muted-foreground">
        You need admin access to read feedback.
      </p>
    );
  }

  const entries = data as FeedbackEntry[];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback inbox</CardTitle>
        <CardDescription>
          User-submitted feedback from the Wasabi console.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No feedback yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, i) => (
                <TableRow key={entry.id ?? `feedback-${i}`}>
                  <TableCell>{entry.username ?? "-"}</TableCell>
                  <TableCell>{entry.rating ?? "-"}</TableCell>
                  <TableCell>{entry.message ?? "-"}</TableCell>
                  <TableCell>{entry.created ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function FeedbackForm({ onSent }: { onSent?: () => void }) {
  const [comments, setComments] = useState("");
  const [score, setScore] = useState(8);
  const [contactOkay, setContactOkay] = useState(false);

  const mutation = useMutation({
    mutationFn: () => sendFeedback({ comments, score, contactOkay }),
    onSuccess: () => {
      toast.success("Feedback sent");
      setComments("");
      onSent?.();
    },
    onError: () => toast.error("Failed to send feedback"),
  });

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="feedback-comments">
          Comments
        </label>
        <textarea
          id="feedback-comments"
          className="flex min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="feedback-score">
          Score (1–10)
        </label>
        <input
          id="feedback-score"
          type="number"
          min={1}
          max={10}
          className="flex h-8 w-20 rounded-lg border px-2 text-sm"
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={contactOkay}
          onChange={(e) => setContactOkay(e.target.checked)}
        />
        OK to contact me about this feedback
      </label>
      <Button
        disabled={!comments.trim() || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        Send feedback
      </Button>
    </div>
  );
}
