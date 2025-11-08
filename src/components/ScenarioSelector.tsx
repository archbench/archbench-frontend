import { useEffect, useId, useLayoutEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Info } from "lucide-react";
import type { Preset } from "@/types/presets";
import Button from "./common/Button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  presets: Preset[];
  activeSlug: string | null;
  onSelect: (presetSlug: string) => void;
};

export default function ScenarioSelector({ presets, activeSlug, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");
  const componentId = useId();
  const listboxId = `${componentId}-presets`;
  const briefPanelId = `${componentId}-brief`;

  const groupedPresets = useMemo(() => {
    const groups = new Map<string, Preset[]>();
    presets.forEach((preset) => {
      const key = preset.meta.category ?? "General";
      const bucket = groups.get(key);
      if (bucket) {
        bucket.push(preset);
      } else {
        groups.set(key, [preset]);
      }
    });
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, bucket]) => ({
        label: key,
        items: bucket.sort((a, b) => a.meta.name.localeCompare(b.meta.name)),
      }));
  }, [presets]);

  const selectedPreset = useMemo(
    () => presets.find((preset) => preset.meta.slug === activeSlug) ?? null,
    [presets, activeSlug],
  );

  useEffect(() => {
    if (!selectedPreset) {
      setBriefOpen(false);
    }
  }, [selectedPreset]);

  const briefContent = (
    <div id={briefPanelId}>
      {selectedPreset ? (
        <BriefTabs preset={selectedPreset} />
      ) : (
        <p className="text-sm text-muted">Select a preset to view its brief.</p>
      )}
    </div>
  );

  const chooserButtonLabel = selectedPreset ? selectedPreset.meta.name : "Select scenario";

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            className="w-64 justify-between"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listboxId}
          >
            <span className="truncate text-left">{chooserButtonLabel}</span>
            <ChevronsUpDown className="h-4 w-4 text-muted" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search scenarios..." aria-label="Search presets" />
            <CommandList id={listboxId}>
              <CommandEmpty>No scenarios found.</CommandEmpty>
              {groupedPresets.map((group) => (
                <CommandGroup key={group.label} heading={group.label}>
                  {group.items.map((preset) => (
                    <CommandItem
                      key={preset.meta.slug}
                      value={`${preset.meta.slug} ${preset.meta.name}`}
                      onSelect={() => {
                        onSelect(preset.meta.slug);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={`h-4 w-4 ${preset.meta.slug === activeSlug ? "opacity-100" : "opacity-0"}`}
                        aria-hidden="true"
                      />
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-medium text-text dark:text-white">
                          {preset.meta.name}
                        </span>
                        <span className="text-xs text-muted">/{preset.meta.slug}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
            <CommandSeparator />
            <p className="px-3 pb-3 text-xs text-muted">
              Use arrow keys ↑↓ to navigate. Press Enter to apply.
            </p>
          </Command>
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Show preset brief"
        onClick={() => setBriefOpen(true)}
        disabled={!selectedPreset}
        aria-controls={briefPanelId}
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </Button>

      {isMobile ? (
        <Drawer open={briefOpen} onOpenChange={setBriefOpen}>
          <DrawerContent aria-describedby={briefPanelId}>
            <DrawerHeader className="space-y-2">
              <DrawerTitle>{selectedPreset?.brief.title ?? "Preset brief"}</DrawerTitle>
              <DrawerDescription>
                {selectedPreset ? `/${selectedPreset.meta.slug}` : "Pick a preset to view details."}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-6">{briefContent}</div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={briefOpen} onOpenChange={setBriefOpen}>
          <DialogContent aria-describedby={briefPanelId}>
            <DialogHeader>
              <DialogTitle>{selectedPreset?.brief.title ?? "Preset brief"}</DialogTitle>
              <DialogDescription>
                {selectedPreset ? `/${selectedPreset.meta.slug}` : "Pick a preset to view details."}
              </DialogDescription>
            </DialogHeader>
            {briefContent}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function BriefTabs({ preset }: { preset: Preset }) {
  const summaryParagraphs = preset.brief.summary
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const workload = preset.brief.workload;

  return (
    <Tabs defaultValue="overview">
      <TabsList className="w-full">
        <TabsTrigger value="overview" className="flex-1">
          Overview
        </TabsTrigger>
        <TabsTrigger value="workload" className="flex-1">
          Workload
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="rounded-md border border-border bg-surface p-4 text-sm leading-relaxed text-text dark:border-borderDark dark:bg-surfaceDark dark:text-white">
        {summaryParagraphs.map((paragraph, index) => (
          <p key={index} className={index ? "mt-3" : undefined}>
            {paragraph}
          </p>
        ))}
      </TabsContent>
      <TabsContent value="workload">
        <div className="rounded-md border border-border bg-surface p-4 text-sm dark:border-borderDark dark:bg-surfaceDark">
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Requests / sec</dt>
              <dd className="text-base font-semibold text-text dark:text-white">
                {workload?.rps?.toLocaleString() ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">p95 target (ms)</dt>
              <dd className="text-base font-semibold text-text dark:text-white">
                {workload?.p95TargetMs ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Cost target ($/h)</dt>
              <dd className="text-base font-semibold text-text dark:text-white">
                {workload?.costTargetPerHour ? workload.costTargetPerHour.toFixed(2) : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
      return;
    }
    const mediaQuery = window.matchMedia(query);
    const handler = () => setMatches(mediaQuery.matches);
    handler();
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
