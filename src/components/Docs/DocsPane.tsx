import { useMemo, useState } from "react";
import Button from "@/components/common/Button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Preset } from "@/types/presets";
import { cn } from "@/lib/utils";
import { Markdown } from "./Markdown";

type Props = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  preset: Preset | null;
  onLoadPreset: (slug: string) => void;
};

const difficultyTone: Record<string, string> = {
  easy: "bg-success/15 text-success border-success/20",
  medium: "bg-warning/20 text-warning border-warning/30",
  hard: "bg-danger/15 text-danger border-danger/25",
};

export default function DocsPane({ open, onOpenChange, preset, onLoadPreset }: Props) {
  const [copied, setCopied] = useState(false);

  const scenarioJson = useMemo(
    () => (preset ? JSON.stringify(preset.scenario, null, 2) : ""),
    [preset],
  );

  const handleCopy = async () => {
    if (!scenarioJson) {
      return;
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(scenarioJson);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = scenarioJson;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy scenario JSON", error);
    }
  };

  const loadPreset = () => {
    if (preset) {
      onLoadPreset(preset.meta.slug);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="z-modal w-full max-w-[480px] overflow-y-auto border-l border-border/60 bg-surface p-6 dark:border-borderDark/60 dark:bg-surfaceDark"
      >
        <SheetHeader className="space-y-2 text-left">
          <SheetTitle className="text-xl font-semibold text-primary">
            {preset?.brief.title ?? "Docs"}
          </SheetTitle>
          <SheetDescription className="text-muted">
            {preset ? `/${preset.meta.slug}` : "No preset selected"}
          </SheetDescription>
        </SheetHeader>

        {preset ? (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {preset.meta.category ? (
                <Badge variant="outline" className="border-border/60 dark:border-borderDark/60">
                  {preset.meta.category}
                </Badge>
              ) : null}
              {preset.meta.difficulty ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "border text-xs capitalize",
                    difficultyTone[preset.meta.difficulty] ?? "border-border/60",
                  )}
                >
                  {preset.meta.difficulty}
                </Badge>
              ) : null}
            </div>

            <Markdown content={preset.brief.summary} />

            <div>
              <h3 className="text-sm font-semibold text-text dark:text-white">Workload</h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Requests / sec</dt>
                  <dd className="font-semibold text-text dark:text-white">
                    {preset.brief.workload?.rps?.toLocaleString() ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">p95 target (ms)</dt>
                  <dd className="font-semibold text-text dark:text-white">
                    {preset.brief.workload?.p95TargetMs ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted">Cost target ($/h)</dt>
                  <dd className="font-semibold text-text dark:text-white">
                    {preset.brief.workload?.costTargetPerHour
                      ? `$${preset.brief.workload.costTargetPerHour.toFixed(2)}`
                      : "—"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="primary" onClick={loadPreset} aria-label="Load preset">
                Load this preset
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCopy}
                aria-label="Copy scenario JSON"
              >
                Copy scenario JSON
              </Button>
              {copied ? <span className="text-xs font-medium text-success">Copied!</span> : null}
            </div>
          </div>
        ) : (
          <p className="mt-8 text-sm text-muted">Select a preset to view its documentation.</p>
        )}
      </SheetContent>
    </Sheet>
  );
}

