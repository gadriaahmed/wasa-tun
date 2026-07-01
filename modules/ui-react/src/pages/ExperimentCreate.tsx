import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createExperiment } from "@/api/experiments";
import { fetchApplications } from "@/api/applications";
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

export function ExperimentCreate() {
  const navigate = useNavigate();
  const [label, setLabel] = useState("");
  const [applicationName, setApplicationName] = useState("");
  const [description, setDescription] = useState("");
  const [samplingPercent, setSamplingPercent] = useState(100);
  const [createNewApplication, setCreateNewApplication] = useState(false);

  const { data: applications = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
  });

  const mutation = useMutation({
    mutationFn: () =>
      createExperiment(
        {
          label,
          applicationName,
          description,
          samplingPercent,
          state: "DRAFT",
        },
        createNewApplication
      ),
    onSuccess: (exp) => {
      toast.success("Experiment created");
      navigate(`/experiments/${exp.id}`);
    },
    onError: () => toast.error("Failed to create experiment"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !applicationName.trim()) {
      toast.error("Name and application are required");
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
              required
            />
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="samplingPercent">Sampling %</Label>
            <Input
              id="samplingPercent"
              type="number"
              min={0}
              max={100}
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
