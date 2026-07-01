import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function Plugins() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plugins</CardTitle>
        <CardDescription>
          Plugin extensibility is reserved for a future release. Legacy
          contrib plugins can continue to use the frozen Angular UI until
          migrated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          No plugins are registered in this React build.
        </p>
      </CardContent>
    </Card>
  );
}
