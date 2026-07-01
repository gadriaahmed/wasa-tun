import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createExperiment } from "@/api/experiments";
import { fetchApplications } from "@/api/applications";
import {
  defaultExperimentEndTime,
  defaultExperimentStartTime,
} from "@/lib/experiment-utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function toDateInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateInputValue(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function ExperimentCreate() {
  const navigate = useNavigate();
  const defaultStart = useMemo(() => defaultExperimentStartTime(), []);
  const defaultEnd = useMemo(
    () => defaultExperimentEndTime(defaultStart),
    [defaultStart]
  );

  const [label, setLabel] = useState("");
  const [applicationName, setApplicationName] = useState("");
  const [newApplicationName, setNewApplicationName] = useState("");
  const [description, setDescription] = useState("");
  const [samplingPercent, setSamplingPercent] = useState(100);
  const [startDate, setStartDate] = useState(toDateInputValue(defaultStart));
  const [endDate, setEndDate] = useState(toDateInputValue(defaultEnd));
  const [createNewApplication, setCreateNewApplication] = useState(false);

  const { data: applications = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
  });

  const resolvedApplicationName = createNewApplication
    ? newApplicationName.trim()
    : applicationName.trim();

  const mutation = useMutation({
    mutationFn: () =>
      createExperiment(
        {
          label,
          applicationName: resolvedApplicationName,
          description,
          samplingPercent,
          startTime: parseDateInputValue(startDate),
          endTime: parseDateInputValue(endDate),
        },
        createNewApplication
      ),
    onSuccess: (exp) => {
      toast.success("Experiment created");
      navigate(`/experiments/${exp.id}`);
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Failed to create experiment";
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      toast.error("Experiment name is required");
      return;
    }
    if (!/^[A-Za-z_$-][A-Za-z0-9_$-]*$/.test(label.trim())) {
      toast.error(
        "Experiment name must start with a letter, underscore, $, or hyphen and contain no spaces"
      );
      return;
    }
    if (!resolvedApplicationName) {
      toast.error("Application is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Description / hypothesis is required");
      return;
    }
    if (parseDateInputValue(endDate) <= parseDateInputValue(startDate)) {
      toast.error("End date must be after start date");
      return;
    }
    if (samplingPercent <= 0 || samplingPercent > 100) {
      toast.error("Sampling must be between 1 and 100");
      return;
    }
    mutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Experiment</CardTitle>
        <CardDescription>
          Define a draft experiment. You can add buckets and start it from the
          detail page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Experiment name</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="my_experiment_name"
              pattern="^[A-Za-z_$-][A-Za-z0-9_$-]*$"
              title="Start with a letter, _, $, or -; no spaces"
              required
            />
          </div>

          {!createNewApplication ? (
            <div className="space-y-2">
              <Label htmlFor="applicationName">Application</Label>
              <Select
                id="applicationName"
                value={applicationName}
                onChange={(e) => setApplicationName(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select application
                </option>
                {applications.map((app) => (
                  <option key={app.applicationName} value={app.applicationName}>
                    {app.applicationName}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="newApplicationName">New application name</Label>
              <Input
                id="newApplicationName"
                value={newApplicationName}
                onChange={(e) => setNewApplicationName(e.target.value)}
                placeholder="MyNewApp"
                required
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="createNewApplication"
              checked={createNewApplication}
              onChange={(e) => setCreateNewApplication(e.target.checked)}
            />
            <Label htmlFor="createNewApplication">
              Create new application if it does not exist
            </Label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description / hypothesis</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you testing?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="samplingPercent">Sampling %</Label>
            <Input
              id="samplingPercent"
              type="number"
              min={1}
              max={100}
              step={1}
              value={samplingPercent}
              onChange={(e) => setSamplingPercent(Number(e.target.value))}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create draft"}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/experiments">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
