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
                <TableHead>Rating</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Created</TableHead>
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
  const { email } = useAuth();
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);

  const mutation = useMutation({
    mutationFn: () =>
      sendFeedback({ message, rating, username: email ?? undefined }),
    onSuccess: () => {
      toast.success("Feedback sent");
      setMessage("");
      onSent?.();
    },
    onError: () => toast.error("Failed to send feedback"),
  });

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="feedback-message">
          Message
        </label>
        <textarea
          id="feedback-message"
          className="flex min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="feedback-rating">
          Rating
        </label>
        <input
          id="feedback-rating"
          type="number"
          min={1}
          max={5}
          className="flex h-8 w-20 rounded-lg border px-2 text-sm"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        />
      </div>
      <Button
        disabled={!message.trim() || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        Send feedback
      </Button>
    </div>
  );
}
