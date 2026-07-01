import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { fetchPriorities, updatePriorities } from "@/api/applications";
import { changeExperimentState } from "@/api/experiments";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { normalizeStatus } from "@/lib/experiment-utils";
import type { PrioritizedExperiment } from "@/types";
import { useState, useEffect } from "react";

function SortableRow({
  item,
  onStart,
  onStop,
}: {
  item: PrioritizedExperiment;
  onStart: () => void;
  onStop: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const status = normalizeStatus(item.state);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border bg-white px-3 py-2"
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="flex-1">
        <p className="font-medium">{item.label}</p>
        <p className="text-xs text-muted-foreground">{item.applicationName}</p>
      </div>
      <StatusBadge status={status} />
      {status === "DRAFT" && (
        <Button size="sm" variant="outline" onClick={onStart}>
          Start
        </Button>
      )}
      {status === "RUNNING" && (
        <Button size="sm" variant="outline" onClick={onStop}>
          Stop
        </Button>
      )}
    </div>
  );
}

export function ApplicationPriorities() {
  const { appName = "" } = useParams();
  const decodedApp = decodeURIComponent(appName);
  const queryClient = useQueryClient();
  const [items, setItems] = useState<PrioritizedExperiment[]>([]);

  const { data = [], isLoading } = useQuery({
    queryKey: ["priorities", decodedApp],
    queryFn: () => fetchPriorities(decodedApp),
    enabled: !!decodedApp,
  });

  useEffect(() => {
    setItems(data as PrioritizedExperiment[]);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => updatePriorities(decodedApp, items),
    onSuccess: () => {
      toast.success("Priorities saved");
      void queryClient.invalidateQueries({ queryKey: ["priorities", decodedApp] });
    },
    onError: () => toast.error("Failed to save priorities"),
  });

  const stateMutation = useMutation({
    mutationFn: ({
      id,
      state,
    }: {
      id: string;
      state: "RUNNING" | "PAUSED";
    }) => changeExperimentState(id, state),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["priorities", decodedApp] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    setItems((current) => {
      const oldIndex = current.findIndex((i) => i.id === active.id);
      const newIndex = current.findIndex((i) => i.id === over.id);
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Priorities — {decodedApp}</CardTitle>
          <CardDescription>
            Drag to reorder experiment priority for batch assignment.
          </CardDescription>
        </div>
        <Button variant="outline" asChild>
          <Link to="/applications">Back</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={items.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {items.map((item) => (
                    <SortableRow
                      key={item.id}
                      item={item}
                      onStart={() =>
                        stateMutation.mutate({ id: item.id, state: "RUNNING" })
                      }
                      onStop={() =>
                        stateMutation.mutate({ id: item.id, state: "PAUSED" })
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              Save order
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
